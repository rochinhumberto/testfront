import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { map, Observable } from "rxjs";
import { Respuestas } from "./interfaces/respuestas";
import { Credentials } from "./interfaces/credenciales";
import { environment } from "src/environments/environment";


@Injectable({
    providedIn: 'root'
})
export class ApiService {

    apiUrl = environment.apiURL;

    constructor(
        private http: HttpClient
    ) { }

    getPolizas(pageNumber: number, pageSize: number): Observable<Respuestas> {
        return this.http.get<Respuestas>(this.apiUrl + `/api/v1/poliza?page=${pageNumber}&page_size=${pageSize}`);
    }

    searchPolizas(query: string, pageNumber: number, pageSize: number): Observable<Respuestas> {
        return this.http.get<Respuestas>(this.apiUrl + `/api/v1/poliza/buscar?query=${query}&page=${pageNumber}&page_size=${pageSize}`);
    }

    getPolizaById(id: number): Observable<Respuestas> {
        return this.http.get<Respuestas>(this.apiUrl + `/api/v1/poliza/${id}`);
    }

    getEmpleados(): Observable<Respuestas> {
        return this.http.get<Respuestas>(this.apiUrl + '/api/v1/empleado');
    }

    getArticulos(): Observable<Respuestas> {
        return this.http.get<Respuestas>(this.apiUrl + '/api/v1/inventario');
    }

    login(creds: Credentials){
        return this.http.post(this.apiUrl + '/api/v1/usuario/login', creds, {
            observe: 'response'
        }).pipe(map((response: HttpResponse<any>) => {
            const body = response.body;
            const token = body.Data.Token
            localStorage.setItem('token', token);
            return body;
        }));
    }

    savePoliza(body: any){
        return this.http.post(this.apiUrl + '/api/v1/poliza', body);
    }

    updatePoliza(id: number, body: any){
        return this.http.put(this.apiUrl + `/api/v1/poliza/${id}`, body);
    }

    deletePoliza(id: number){
        return this.http.delete(this.apiUrl + `/api/v1/poliza/${id}`);
    }

    getToken(){
        return localStorage.getItem('token');
    }
}