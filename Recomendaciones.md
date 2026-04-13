
# Levanta la api en dos tipos de ambientes: 

Desarrollo 
```bash
    npm start
```

Productivo
```bash
    npm run build
```



## Para autentificar localmente

```PowerShell
cmd /c curl -v -H "Content-Type: application/json" -d "{"nombreUsuario":"alejandrina","contrasena":"libreria123"}" http://127.0.0.1:3000/api/usuarios-acceso/validar

```

## Para probar el endpoint localmente con el token generado
```PowerShell
cmd /c curl -v -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlVXN1YXJpbyI6ImFsZWphbmRyaW5hIiwidGllbmVQZXJtaXNvIjp0cnVlLCJpYXQiOjE3NzYwMzg1MjQsImV4cCI6MTc3NjEyNDkyNH0.MNHR9MRNwTT38wL-mwOMLChvuwNOmDhFfBy1uqftyBI" http://127.0.0.1:3000/api/productos/activos
```

# Realiza los dos pasos al mismo tiempo: Login y Llama al endpoint de productos

```PowerShell
    $response = Invoke-RestMethod -Method Post `
        -Uri "http://127.0.0.1:3000/api/usuarios-acceso/validar" `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body '{"nombreUsuario":"alejandrina","contrasena":"libreria123"}'

    # Extraer token
    $token = $response.token

    # Llamar endpoint protegido
    Invoke-RestMethod -Method Get `
    -Uri "http://127.0.0.1:3000/api/productos/activos" `
    -Headers @{ "Authorization" = "Bearer $token" }
```