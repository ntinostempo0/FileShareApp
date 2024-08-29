namespace SharedCode.Models
{
    public class UserModel
    {
        public List<string> files { get; set; }
        public string display_name { get; set; }
        public string email { get; set; }


    }

    public class UserGlobal
    {
        static public string ID{get; set;}
        static public List<string> Files { get; set; }
        static public string DisplayName { get; set; }
        static public string Email { get; set; }

        
    }

    public static class UserFilesGlobal
    {
        public static List<string> Name { get; set; } = new List<string>();
        public static List<string> URL { get; set; } = new List<string>();
        public static List<string> ID { get; set; } = new List<string>();
    }


    public class SearchedStructure
    {
        public string owner { get; set; }
        public List<string> keywords { get; set; }
        public string name { get; set; }
        public string url { get; set; }
        public Dictionary<string,int> createdAt { get; set; }
    }

    public class FileStructure
    {
        public string id { get; set; }
        public string url { get; set; }
        public string name { get; set; }
    }
}
