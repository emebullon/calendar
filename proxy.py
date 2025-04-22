from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
import ssl

class ProxyHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # Configurar la petición a la API de la FEB
        url = "https://intrafeb.feb.es/identity.api/connect/token"
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
        
        try:
            # Crear un contexto SSL que no verifique el certificado
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            
            req = urllib.request.Request(url, data=post_data, headers=headers)
            response = urllib.request.urlopen(req, context=ctx)
            
            # Leer la respuesta
            response_data = response.read()
            
            # Enviar la respuesta al cliente
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(response_data)
            
        except urllib.error.URLError as e:
            print(f"Error en POST: {str(e)}")
            self.send_error(500, str(e))
    
    def do_GET(self):
        print(f"Recibida petición GET para: {self.path}")
        
        if self.path.startswith('/api/v1/'):
            # Extraer el token del header de autorización
            auth_header = self.headers.get('Authorization')
            if not auth_header:
                self.send_error(401, "No authorization header")
                return
            
            # Construir la URL correcta para la API
            api_path = self.path[7:]  # Eliminar el '/api/v1' inicial
            url = f"https://intrafeb.feb.es/livestats.api/api/v1/{api_path.lstrip('/')}"
            print(f"Llamando a URL: {url}")
            
            headers = {
                'Authorization': auth_header,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                
                req = urllib.request.Request(url, headers=headers)
                print(f"Headers enviados: {headers}")
                response = urllib.request.urlopen(req, context=ctx)
                
                # Leer la respuesta
                response_data = response.read()
                print(f"Respuesta recibida: {response_data.decode('utf-8')}")
                
                # Enviar la respuesta al cliente
                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_data)
                
            except urllib.error.URLError as e:
                print(f"Error en GET: {str(e)}")
                error_message = str(e)
                if hasattr(e, 'read'):
                    error_message = e.read().decode('utf-8')
                print(f"Detalles del error: {error_message}")
                self.send_error(500, error_message)
        else:
            print(f"Ruta no soportada: {self.path}")
            self.send_error(404, "Not Found")
    
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')

def run_proxy_server(port=8001):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProxyHTTPRequestHandler)
    print(f'Iniciando servidor proxy en el puerto {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run_proxy_server() 