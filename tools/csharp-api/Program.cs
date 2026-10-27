// Dumps the public C# API of Ara.Runtime to JSON for the docs site: every public type
// outside Ara.Hosting, its members as C# signatures, and their XML doc comments as
// Markdown (crefs become /docs/scripting links).
//
//   dotnet run --project tools/csharp-api -- <Ara.Runtime.dll> <Ara.Runtime.xml> <out.json>
//
// The assembly is read with MetadataLoadContext, so nothing in it runs.

using System.ComponentModel;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;

if (args.Length != 3)
{
    Console.Error.WriteLine("usage: csharp-api <Ara.Runtime.dll> <Ara.Runtime.xml> <out.json>");
    return 2;
}

var dllPath = Path.GetFullPath(args[0]);
var dlls = Directory.GetFiles(RuntimeEnvironment.GetRuntimeDirectory(), "*.dll")
    .Concat(Directory.GetFiles(Path.GetDirectoryName(dllPath)!, "*.dll"));
using var mlc = new MetadataLoadContext(new PathAssemblyResolver(dlls), "System.Private.CoreLib");
var asm = mlc.LoadFromAssemblyPath(dllPath);
var docs = XDocument.Load(args[1]).Descendants("member")
    .GroupBy(m => (string)m.Attribute("name")!)
    .ToDictionary(g => g.Key, g => g.First());

var types = asm.GetTypes()
    .Where(Documented)
    .OrderBy(t => DisplayName(t), StringComparer.Ordinal)
    .Select(DescribeType)
    .ToList();

Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(args[2]))!);
File.WriteAllText(args[2], JsonSerializer.Serialize(
    new { assembly = asm.GetName().Name, version = asm.GetName().Version?.ToString(), types },
    new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
Console.WriteLine($"wrote {types.Count} types to {args[2]}");
return 0;

// ---------- Which types and members are documented ----------

bool Documented(Type t)
{
    if (t.Namespace is not { } ns || ns.StartsWith("Ara.Hosting", StringComparison.Ordinal)) return false;
    if (!ns.StartsWith("Ara", StringComparison.Ordinal)) return false;
    if (Hidden(t) || t.Name.StartsWith('<')) return false;
    for (var x = t; x != null; x = x.DeclaringType)
        if (!(x.IsPublic || x.IsNestedPublic || x.IsNestedFamily || x.IsNestedFamORAssem)) return false;
    return true;
}

bool Hidden(MemberInfo m) => m.GetCustomAttributesData().Any(a =>
    a.AttributeType.FullName == "System.Runtime.CompilerServices.CompilerGeneratedAttribute" ||
    (a.AttributeType.FullName == typeof(EditorBrowsableAttribute).FullName &&
     a.ConstructorArguments.FirstOrDefault().Value is int s && s == (int)EditorBrowsableState.Never));

bool Visible(MethodBase? m) => m is { IsPublic: true } or { IsFamily: true } or { IsFamilyOrAssembly: true };

bool Has(IEnumerable<CustomAttributeData> attrs, string name) =>
    attrs.Any(a => a.AttributeType.FullName == $"System.Runtime.CompilerServices.{name}");

// ---------- Types ----------

object DescribeType(Type t)
{
    var doc = Doc(DocId(t));
    var members = new List<object>();
    var values = new List<object>();
    const BindingFlags Declared = BindingFlags.DeclaredOnly | BindingFlags.Public | BindingFlags.NonPublic |
                                  BindingFlags.Instance | BindingFlags.Static;

    if (t.IsEnum)
    {
        foreach (var f in t.GetFields(Declared).Where(f => f.IsLiteral))
            values.Add(new { name = f.Name, value = f.GetRawConstantValue()?.ToString(), summary = Md(Doc(DocId(f))?.Element("summary")) });
    }
    else
    {
        // Parameterless constructors only when documented: the implicit ones are noise.
        foreach (var c in t.GetConstructors(Declared).Where(c => Visible(c) && !Hidden(c) && (c.GetParameters().Length > 0 || Doc(DocId(c)) != null)))
            members.Add(Member("constructor", t.Name.Split('`')[0], CtorSignature(c), DocId(c), c.GetParameters()));
        foreach (var p in t.GetProperties(Declared).Where(p => (Visible(p.GetMethod) || Visible(p.SetMethod)) && !Hidden(p)))
            members.Add(Member("property", p.Name, PropertySignature(p), DocId(p), p.GetIndexParameters()));
        foreach (var f in t.GetFields(Declared).Where(f => (f.IsPublic || f.IsFamily || f.IsFamilyOrAssembly) && !Hidden(f) && !f.IsSpecialName))
            members.Add(Member("field", f.Name, FieldSignature(f), DocId(f), []));
        foreach (var e in t.GetEvents(Declared).Where(e => Visible(e.AddMethod) && !Hidden(e)))
            members.Add(Member("event", e.Name, $"{Access(e.AddMethod!)} event {TypeName(e.EventHandlerType!)} {e.Name};", DocId(e), []));
        foreach (var m in t.GetMethods(Declared).Where(m => Visible(m) && !Hidden(m) && (!m.IsSpecialName || m.Name.StartsWith("op_"))))
            members.Add(Member(m.Name.StartsWith("op_") ? "operator" : "method", MethodName(m), MethodSignature(m), DocId(m), m.GetParameters()));
    }

    return new
    {
        slug = t.Name.Split('`')[0],
        name = DisplayName(t),
        @namespace = t.Namespace,
        kind = Kind(t),
        declaration = TypeDeclaration(t),
        summary = Md(doc?.Element("summary")),
        remarks = Md(doc?.Element("remarks")),
        example = Md(doc?.Element("example")),
        typeParams = TypeParamDocs(doc),
        members,
        values,
    };
}

object Member(string kind, string name, string signature, string id, ParameterInfo[] parameters)
{
    var doc = Doc(id);
    return new
    {
        kind,
        name,
        signature,
        summary = Md(doc?.Element("summary")),
        remarks = Md(doc?.Element("remarks")),
        example = Md(doc?.Element("example")),
        returns = Md(doc?.Element("returns")),
        value = Md(doc?.Element("value")),
        typeParams = TypeParamDocs(doc),
        @params = parameters.Select(p => new
        {
            name = p.Name,
            summary = Md(doc?.Elements("param").FirstOrDefault(e => (string?)e.Attribute("name") == p.Name)),
        }).ToList(),
    };
}

List<object> TypeParamDocs(XElement? doc) =>
    doc?.Elements("typeparam").Select(e => (object)new { name = (string?)e.Attribute("name"), summary = Md(e) }).ToList() ?? [];

string Kind(Type t)
{
    if (t.IsEnum) return "enum";
    if (t.IsInterface) return "interface";
    if (t.IsValueType) return "struct";
    if (t.BaseType?.FullName == "System.MulticastDelegate") return "delegate";
    for (var b = t.BaseType; b != null; b = b.BaseType)
        if (b.FullName == "System.Attribute") return "attribute";
    return "class";
}

string TypeDeclaration(Type t)
{
    var sb = new StringBuilder(t.IsNestedFamily ? "protected " : "public ");
    var attrs = t.GetCustomAttributesData();
    if (t.IsEnum)
    {
        sb.Append("enum ").Append(t.Name);
        var underlying = t.GetFields().First(f => !f.IsStatic).FieldType;
        if (underlying.FullName != "System.Int32") sb.Append(" : ").Append(TypeName(underlying));
        return sb.ToString();
    }
    if (t.IsInterface) sb.Append("interface ");
    else if (t.IsValueType)
    {
        if (Has(attrs, "IsReadOnlyAttribute")) sb.Append("readonly ");
        if (Has(attrs, "IsByRefLikeAttribute")) sb.Append("ref ");
        sb.Append("struct ");
    }
    else
    {
        if (t.IsAbstract && t.IsSealed) sb.Append("static ");
        else if (t.IsAbstract) sb.Append("abstract ");
        else if (t.IsSealed) sb.Append("sealed ");
        if (t.GetMethods(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public).Any(m => m.Name == "<Clone>$"))
            sb.Append("record ");
        else sb.Append("class ");
    }
    sb.Append(DisplayName(t));

    var bases = new List<string>();
    if (t.BaseType is { } b && b.FullName is not ("System.Object" or "System.ValueType")) bases.Add(TypeName(b));
    var inherited = t.BaseType?.GetInterfaces() ?? [];
    bases.AddRange(t.GetInterfaces().Where(i => !inherited.Contains(i) && i.Namespace?.StartsWith("Ara.Hosting") != true)
        .Select(TypeName));
    if (bases.Count > 0) sb.Append(" : ").Append(string.Join(", ", bases));
    if (t.IsGenericTypeDefinition) sb.Append(Constraints(t.GetGenericArguments()));
    return sb.ToString();
}

// ---------- Member signatures ----------

string Access(MethodBase m) => m.IsPublic ? "public" : "protected";

string Modifiers(MethodInfo m)
{
    if (m.DeclaringType!.IsInterface) return m.IsStatic ? "static " : "";
    if (m.IsStatic) return "static ";
    // A virtual method that doesn't open a new vtable slot overrides one; a final one in a
    // new slot is just an interface implementation.
    var newSlot = m.Attributes.HasFlag(MethodAttributes.NewSlot);
    if (!m.IsVirtual || (m.IsFinal && newSlot)) return "";
    if (!newSlot) return m.IsFinal ? "sealed override " : "override ";
    return m.IsAbstract ? "abstract " : "virtual ";
}

string ReturnPrefix(MethodInfo m)
{
    if (!m.ReturnType.IsByRef) return TypeName(m.ReturnType);
    return (Has(m.ReturnParameter.GetCustomAttributesData(), "IsReadOnlyAttribute") ? "ref readonly " : "ref ") +
           TypeName(m.ReturnType.GetElementType()!);
}

string MethodName(MethodInfo m) => m.Name switch
{
    "op_Implicit" => "implicit operator",
    "op_Explicit" => "explicit operator",
    var n when n.StartsWith("op_") => "operator " + Operator(n),
    var n => n,
};

string Operator(string name) => name switch
{
    "op_Addition" => "+", "op_Subtraction" => "-", "op_Multiply" => "*", "op_Division" => "/",
    "op_Modulus" => "%", "op_Equality" => "==", "op_Inequality" => "!=", "op_LessThan" => "<",
    "op_GreaterThan" => ">", "op_LessThanOrEqual" => "<=", "op_GreaterThanOrEqual" => ">=",
    "op_UnaryNegation" => "-", "op_UnaryPlus" => "+", "op_LogicalNot" => "!", "op_BitwiseAnd" => "&",
    "op_BitwiseOr" => "|", "op_ExclusiveOr" => "^", "op_OnesComplement" => "~",
    "op_Increment" => "++", "op_Decrement" => "--", "op_True" => "true", "op_False" => "false",
    _ => name[3..],
};

string MethodSignature(MethodInfo m)
{
    var generic = m.IsGenericMethodDefinition ? $"<{string.Join(", ", m.GetGenericArguments().Select(a => a.Name))}>" : "";
    var parameters = Parameters(m.GetParameters(), Has(m.GetCustomAttributesData(), "ExtensionAttribute"));
    var constraints = m.IsGenericMethodDefinition ? Constraints(m.GetGenericArguments()) : "";
    return m.Name is "op_Implicit" or "op_Explicit"
        ? $"{Access(m)} static {MethodName(m)} {TypeName(m.ReturnType)}({parameters});"
        : $"{Access(m)} {Modifiers(m)}{ReturnPrefix(m)} {MethodName(m)}{generic}({parameters}){constraints};";
}

string CtorSignature(ConstructorInfo c) =>
    $"{Access(c)} {DisplayName(c.DeclaringType!).Split('<')[0]}({Parameters(c.GetParameters(), false)});";

string PropertySignature(PropertyInfo p)
{
    var any = (p.GetMethod is { } g && Visible(g) ? g : p.SetMethod)!;
    var index = p.GetIndexParameters();
    var name = index.Length > 0 ? $"this[{Parameters(index, false)}]" : p.Name;
    var type = p.PropertyType.IsByRef
        ? (p.GetMethod is { } getter && Has(getter.ReturnParameter.GetCustomAttributesData(), "IsReadOnlyAttribute") ? "ref readonly " : "ref ") +
          TypeName(p.PropertyType.GetElementType()!)
        : TypeName(p.PropertyType);
    var accessors = new List<string>();
    if (Visible(p.GetMethod)) accessors.Add("get;");
    if (Visible(p.SetMethod))
    {
        var init = p.SetMethod!.ReturnParameter.GetRequiredCustomModifiers()
            .Any(x => x.FullName == "System.Runtime.CompilerServices.IsExternalInit");
        accessors.Add(init ? "init;" : "set;");
    }
    return $"{Access(any)} {Modifiers((MethodInfo)any)}{type} {name} {{ {string.Join(" ", accessors)} }}";
}

string FieldSignature(FieldInfo f)
{
    var access = f.IsPublic ? "public" : "protected";
    if (f.IsLiteral) return $"{access} const {TypeName(f.FieldType)} {f.Name} = {Literal(f.GetRawConstantValue(), f.FieldType)};";
    var mods = (f.IsStatic ? "static " : "") + (f.IsInitOnly ? "readonly " : "");
    return $"{access} {mods}{TypeName(f.FieldType)} {f.Name};";
}

string Parameters(ParameterInfo[] ps, bool extension) => string.Join(", ", ps.Select((p, i) =>
{
    var sb = new StringBuilder();
    if (extension && i == 0) sb.Append("this ");
    var attrs = p.GetCustomAttributesData();
    if (p.ParameterType.IsByRef)
    {
        sb.Append(p.IsOut ? "out " : Has(attrs, "IsReadOnlyAttribute") ? "in " :
            Has(attrs, "RequiresLocationAttribute") ? "ref readonly " : "ref ");
        sb.Append(TypeName(p.ParameterType.GetElementType()!));
    }
    else
    {
        if (attrs.Any(a => a.AttributeType.FullName == "System.ParamArrayAttribute")) sb.Append("params ");
        sb.Append(TypeName(p.ParameterType));
    }
    sb.Append(' ').Append(p.Name);
    if (p.HasDefaultValue) sb.Append(" = ").Append(Literal(p.RawDefaultValue, p.ParameterType));
    return sb.ToString();
}));

string Constraints(Type[] generics)
{
    var sb = new StringBuilder();
    foreach (var g in generics)
    {
        var list = new List<string>();
        var flags = g.GenericParameterAttributes;
        if (flags.HasFlag(GenericParameterAttributes.ReferenceTypeConstraint)) list.Add("class");
        var valueType = flags.HasFlag(GenericParameterAttributes.NotNullableValueTypeConstraint);
        if (valueType) list.Add(Has(g.GetCustomAttributesData(), "IsUnmanagedAttribute") ? "unmanaged" : "struct");
        list.AddRange(g.GetGenericParameterConstraints().Where(c => c.FullName != "System.ValueType").Select(TypeName));
        if (flags.HasFlag(GenericParameterAttributes.DefaultConstructorConstraint) && !valueType) list.Add("new()");
        if (list.Count > 0) sb.Append($" where {g.Name} : {string.Join(", ", list)}");
    }
    return sb.ToString();
}

string Literal(object? value, Type type)
{
    if (value is null) return type.IsValueType && !IsNullable(type) ? "default" : "null";
    if (type.IsEnum)
    {
        var match = type.GetFields().FirstOrDefault(f => f.IsLiteral && Equals(f.GetRawConstantValue(), value));
        return match != null ? $"{type.Name}.{match.Name}" : $"({type.Name}){value}";
    }
    return value switch
    {
        string s => JsonSerializer.Serialize(s),
        bool b => b ? "true" : "false",
        float f => f.ToString("R", System.Globalization.CultureInfo.InvariantCulture) + "f",
        double d => d.ToString("R", System.Globalization.CultureInfo.InvariantCulture),
        char c => $"'{c}'",
        _ => Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture) ?? "",
    };
}

bool IsNullable(Type t) => t.IsGenericType && t.GetGenericTypeDefinition().FullName == "System.Nullable`1";

// ---------- C# type names ----------

string DisplayName(Type t)
{
    var name = t.Name.Split('`')[0];
    if (t.DeclaringType != null && Documented(t.DeclaringType)) name = DisplayName(t.DeclaringType).Split('<')[0] + "." + name;
    var own = t.GetGenericArguments().Skip(t.DeclaringType?.GetGenericArguments().Length ?? 0).ToArray();
    return own.Length > 0 && t.Name.Contains('`') ? $"{name}<{string.Join(", ", own.Select(a => a.Name))}>" : name;
}

string TypeName(Type t)
{
    if (t.IsByRef) return TypeName(t.GetElementType()!);
    if (t.IsPointer) return TypeName(t.GetElementType()!) + "*";
    if (t.IsArray) return TypeName(t.GetElementType()!) + "[" + new string(',', t.GetArrayRank() - 1) + "]";
    if (t.IsGenericParameter) return t.Name;
    if (IsNullable(t)) return TypeName(t.GetGenericArguments()[0]) + "?";
    var keyword = t.FullName switch
    {
        "System.Void" => "void", "System.Object" => "object", "System.String" => "string",
        "System.Boolean" => "bool", "System.Byte" => "byte", "System.SByte" => "sbyte",
        "System.Int16" => "short", "System.UInt16" => "ushort", "System.Int32" => "int",
        "System.UInt32" => "uint", "System.Int64" => "long", "System.UInt64" => "ulong",
        "System.Single" => "float", "System.Double" => "double", "System.Decimal" => "decimal",
        "System.Char" => "char", "System.IntPtr" => "nint", "System.UIntPtr" => "nuint",
        _ => null,
    };
    if (keyword != null) return keyword;
    var name = t.Name.Split('`')[0];
    if (t.DeclaringType != null && !t.IsGenericParameter) name = TypeName(t.DeclaringType).Split('<')[0] + "." + name;
    return t.IsGenericType ? $"{name}<{string.Join(", ", t.GetGenericArguments().Select(TypeName))}>" : name;
}

// ---------- XML doc IDs ----------

string DocTypeName(Type t) =>
    (t.DeclaringType != null ? DocTypeName(t.DeclaringType) : t.Namespace) + "." + t.Name;

string DocParam(Type t)
{
    if (t.IsByRef) return DocParam(t.GetElementType()!) + "@";
    if (t.IsPointer) return DocParam(t.GetElementType()!) + "*";
    if (t.IsArray) return DocParam(t.GetElementType()!) + (t.GetArrayRank() == 1 ? "[]" : "[" + string.Join(",", Enumerable.Repeat("0:", t.GetArrayRank())) + "]");
    if (t.IsGenericParameter) return (t.DeclaringMethod != null ? "``" : "`") + t.GenericParameterPosition;
    if (t.IsGenericType && !t.IsGenericTypeDefinition)
    {
        var def = DocTypeName(t.GetGenericTypeDefinition());
        return Regex.Replace(def, "`\\d+$", "") + "{" + string.Join(",", t.GetGenericArguments().Select(DocParam)) + "}";
    }
    return DocTypeName(t);
}

string DocId(MemberInfo m)
{
    if (m is Type t) return "T:" + DocTypeName(t);
    var owner = DocTypeName(m.DeclaringType!);
    switch (m)
    {
        case FieldInfo: return $"F:{owner}.{m.Name}";
        case EventInfo: return $"E:{owner}.{m.Name}";
        case PropertyInfo p:
            var ip = p.GetIndexParameters();
            return $"P:{owner}.{p.Name}" + (ip.Length > 0 ? "(" + string.Join(",", ip.Select(x => DocParam(x.ParameterType))) + ")" : "");
        case MethodBase mb:
            var name = mb is ConstructorInfo ? (mb.IsStatic ? "#cctor" : "#ctor") : mb.Name;
            if (mb.IsGenericMethodDefinition) name += "``" + mb.GetGenericArguments().Length;
            var ps = mb.GetParameters();
            var id = $"M:{owner}.{name}" + (ps.Length > 0 ? "(" + string.Join(",", ps.Select(x => DocParam(x.ParameterType))) + ")" : "");
            if (mb is MethodInfo mi && mi.Name is "op_Implicit" or "op_Explicit") id += "~" + DocParam(mi.ReturnType);
            return id;
        default: return "";
    }
}

XElement? Doc(string id)
{
    if (docs.TryGetValue(id, out var el)) return el;
    // Generated or odd signatures: fall back to the one doc entry with this member name, if unique.
    var stem = id.Split('(')[0];
    var matches = docs.Keys.Where(k => k.Split('(')[0] == stem).ToList();
    return matches.Count == 1 ? docs[matches[0]] : null;
}

// ---------- XML doc → Markdown ----------

string? Md(XElement? el)
{
    if (el == null) return null;
    var text = Regex.Replace(Inline(el).Trim(), "[ \\t]*\\n[ \\t]*\\n[\\s]*", "\n\n");
    return text.Length == 0 ? null : text;
}

string Inline(XElement el)
{
    var sb = new StringBuilder();
    foreach (var node in el.Nodes())
    {
        if (node is XText x) { sb.Append(Regex.Replace(x.Value, "\\s+", " ")); continue; }
        if (node is not XElement e) continue;
        switch (e.Name.LocalName)
        {
            case "c": sb.Append('`').Append(e.Value).Append('`'); break;
            case "code": sb.Append("\n\n```csharp\n").Append(Dedent(e.Value)).Append("\n```\n\n"); break;
            case "para": sb.Append("\n\n").Append(Inline(e).Trim()).Append("\n\n"); break;
            case "br": sb.Append('\n'); break;
            case "paramref" or "typeparamref": sb.Append('`').Append((string?)e.Attribute("name")).Append('`'); break;
            case "see":
                if (e.Attribute("langword") is { } lw) sb.Append('`').Append(lw.Value).Append('`');
                else if (e.Attribute("href") is { } href) sb.Append($"[{(e.Value.Length > 0 ? e.Value : href.Value)}]({href.Value})");
                else if (e.Attribute("cref") is { } cref) sb.Append(Cref(cref.Value, e.Value));
                break;
            case "list":
                sb.Append("\n\n");
                foreach (var item in e.Elements("item"))
                {
                    var term = item.Element("term");
                    var desc = item.Element("description");
                    sb.Append("- ").Append(term != null ? $"**{Inline(term).Trim()}**" + (desc != null ? ": " : "") : "")
                      .Append(desc != null ? Inline(desc).Trim() : term == null ? Inline(item).Trim() : "").Append('\n');
                }
                sb.Append('\n');
                break;
            case "seealso": break;
            default: sb.Append(Inline(e)); break;
        }
    }
    return sb.ToString();
}

/// <summary>A cref as Markdown: a link for documented Ara types and their members, else code.</summary>
string Cref(string cref, string label)
{
    var kind = cref[0];
    var path = Regex.Replace(cref[2..].Split('(')[0], "`+\\d+", "");
    var parts = path.Split('.');
    var typeParts = kind == 'T' ? parts : parts[..^1];
    var member = kind == 'T' ? null : parts[^1].Replace("#ctor", typeParts[^1]);
    var typeFull = string.Join(".", typeParts);
    var target = asm.GetTypes().FirstOrDefault(t => Regex.Replace(DocTypeName(t), "`\\d+", "").Replace('+', '.') == typeFull);
    var text = label.Length > 0 ? label : member ?? (target != null ? DisplayName(target) : typeParts[^1]);
    if (target == null || !Documented(target)) return $"`{text}`";
    var href = "/docs/scripting/" + target.Name.Split('`')[0] + (member != null ? "#" + member.ToLowerInvariant() : "");
    return $"[`{text}`]({href})";
}

static string Dedent(string code)
{
    var lines = code.Replace("\r", "").Split('\n').SkipWhile(string.IsNullOrWhiteSpace).Reverse()
        .SkipWhile(string.IsNullOrWhiteSpace).Reverse().ToList();
    var indent = lines.Where(l => l.Trim().Length > 0).Select(l => l.Length - l.TrimStart().Length).DefaultIfEmpty(0).Min();
    return string.Join("\n", lines.Select(l => l.Length >= indent ? l[indent..] : l.TrimStart()));
}
