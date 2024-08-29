using System.Text;
using System.Text.Json;
using System.Net.Http.Json;

namespace SharedCode
{
    public class UploadResult
    {
        public string DownloadUrl { get; set; }
    }

    public class CommandsHTTP
    {
        // Creates new Http Client
        private readonly HttpClient httpClient = new HttpClient();

        // Initialize and sets URL
        public CommandsHTTP(string baseURL)
        {
            httpClient.BaseAddress = new Uri(baseURL);

        }

        // Reset Base URL Method
        public void ResetURI(string baseURL)
        {
            httpClient.BaseAddress = new Uri(baseURL);
        }

        // EndPoint is the last string of the URL
        //Get method
        public async Task<string> GetMethod(string endpoint)
        {
            Console.WriteLine($"GET METHOD HERE");
            try
            {
                HttpResponseMessage response = await httpClient.GetAsync(endpoint);
                response.EnsureSuccessStatusCode(); // Throw if not a success code.
                Console.WriteLine($"GET METHOD --- Status Code{response.StatusCode.ToString()}");
                string responseBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"GET METHOD RETURN HERE");
                return responseBody;
            }
            catch (HttpRequestException e)
            {
                // Handle exception
                Console.WriteLine($"Request error: {e.Message}");
                return null;
            }
            catch (Exception e)
            {
                Console.WriteLine($"OTHER ERROR: {e.Message}");
                return null;
            }

        }

        // Post Method
        public async Task<string> PostMethod(string endpoint, Dictionary<string, object> data)
        {
            try
            {
                HttpContent content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
                Console.WriteLine($"-----------------------------------------------------------------JSON: {JsonSerializer.Serialize(data).ToString()}");
                HttpResponseMessage response = await httpClient.PostAsync(endpoint, content);

                response.EnsureSuccessStatusCode(); // Throw if not a success code.
                string responseBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"-----------------------------------------------------------------RESPONSE: {responseBody}");

                return responseBody;
            }
            catch (HttpRequestException e)
            {
                // Handle exception
                Console.WriteLine($"Request error: {e.Message}");
                return null;
            }
            catch (Exception e)
            {
                Console.WriteLine($"OTHER ERROR: {e.Message}");
                return null;
            }
        }


        public async Task<string> createUser(string email, string password, string displayName) 
        {

            var parameters = new Dictionary<string, object>
                                    {
                                        {"email", email},
                                        {"password", password},
                                        {"displayName", displayName}
                                    };

            return await PostMethod("createNewUser", parameters);

        }


        public async Task<string> FileUpload(string endpoint, MultipartFormDataContent document)
        {
            var response = await httpClient.PostAsync(endpoint, document);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<UploadResult>();
            return result.DownloadUrl;



        }
    
        
        public async Task<string> getFile(string endpoint, string FileId)
        {
            return await GetMethod("/getFile?fid=" + FileId); ;

        }


    }
}
