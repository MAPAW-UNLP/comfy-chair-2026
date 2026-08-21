# Test de Usuario - Sistema de Autenticación
**Fecha de presentación:** Jueves 9 de Octubre 2025

## Objetivo
Demostrar el funcionamiento completo del sistema de autenticación, incluyendo:
- Protección de rutas autenticadas
- Registro de nuevos usuarios
- Inicio de sesión
- Validación y manejo de errores en formularios

---

## Caso de Prueba 1: Protección de Rutas
**Objetivo:** Verificar que la ruta `/panel` está protegida y redirige a usuarios no autenticados.

### Pasos:
1. Abrir el navegador en modo incógnito (para asegurar que no hay sesión activa)
2. Navegar directamente a `http://localhost:5173/panel`

### Resultado Esperado:
- ✅ El sistema debe redirigir automáticamente a `/ingresar?redirect=/panel`
- ✅ Se muestra la página de login con el mensaje "¡Que bueno volver a verte!"
- ✅ Después de iniciar sesión exitosamente, el usuario será redirigido de vuelta a `/panel`

### Notas:
- La protección se implementa mediante el layout autenticado `_auth.tsx`
- El parámetro `redirect` permite volver a la página original después del login

---

## Caso de Prueba 2: Validación de Formulario de Registro
**Objetivo:** Verificar que el formulario de registro valida correctamente los campos antes de enviar datos al servidor.

### Pasos:
1. Navegar a `http://localhost:5173/registrarse`
2. Intentar enviar el formulario vacío (hacer clic en "Crear cuenta" sin llenar campos)

### Resultado Esperado:
- ✅ Se muestran mensajes de error debajo de cada campo:
  - "Nombre completo: [mensaje de error]"
  - "Afiliación: [mensaje de error]"
  - "Email: [mensaje de error]"
  - "Contraseña: [mensaje de error]"
  - "Confirmación: [mensaje de error]"
- ✅ Los campos con error tienen un borde rojo
- ✅ No se realiza ninguna petición al servidor

### Prueba adicional - Contraseñas no coinciden:
3. Llenar todos los campos correctamente pero con contraseñas diferentes:
   - Nombre completo: `Juan Pérez`
   - Afiliación: `Universidad de Ejemplo`
   - Email: `juan.perez@example.com`
   - Contraseña: `Password123`
   - Confirmación: `Password456` (diferente)
4. Hacer clic en "Crear cuenta"

### Resultado Esperado:
- ✅ Se muestra un error en el campo "Confirmación" indicando que las contraseñas no coinciden
- ✅ No se envía la petición al servidor

---

## Caso de Prueba 3: Registro Exitoso de Usuario
**Objetivo:** Crear una nueva cuenta de usuario correctamente.

### Pasos:
1. Navegar a `http://localhost:5173/registrarse`
2. Llenar el formulario con datos válidos:
   - Nombre completo: `María González`
   - Afiliación: `UNLP`
   - Email: `maria.gonzalez@gmail.com`
   - Contraseña: `123456`
   - Confirmación: `123456`
3. Hacer clic en "Crear cuenta"

### Resultado Esperado:
- ✅ El botón cambia a "Creando cuenta..." mientras procesa
- ✅ El usuario es redirigido a `/ingresar`
- ✅ Se muestra un **mensaje verde** en la parte superior del formulario de login:
  - "¡Cuenta creada exitosamente! Por favor, inicia sesión con tus credenciales."
- ✅ El mensaje es claramente visible con fondo verde claro

---

## Caso de Prueba 4: Error de Registro - Email Duplicado
**Objetivo:** Verificar el manejo de errores cuando se intenta registrar un email que ya existe.

### Pasos:
1. Navegar a `http://localhost:5173/registrarse`
2. Intentar registrar el mismo email del Caso de Prueba 3:
   - Nombre completo: `Otro Usuario`
   - Afiliación: `Otra Institución`
   - Email: `maria.gonzalez@gmail.com` (ya registrado)
   - Contraseña: `123456`
   - Confirmación: `123456`
3. Hacer clic en "Crear cuenta"

### Resultado Esperado:
- ✅ Se muestra un **mensaje de error genérico** en un recuadro rojo:
  - "No se pudo crear la cuenta. Por favor, verifica tus datos o intenta nuevamente."
- ✅ El error aparece sobre el botón de envío
- ✅ Los datos del formulario se mantienen (no se borran)

### Notas:
- Por seguridad, no se especifica si el email ya existe
- El mensaje es genérico para todos los errores 4xx

---

## Caso de Prueba 5: Validación de Formulario de Login
**Objetivo:** Verificar la validación del formulario de inicio de sesión.

### Pasos:
1. Navegar a `http://localhost:5173/ingresar`
2. Intentar enviar el formulario con campos vacíos

### Resultado Esperado:
- ✅ Se muestran mensajes de error debajo de cada campo
- ✅ Los campos tienen borde rojo
- ✅ No se envía petición al servidor

### Prueba adicional - Email inválido:
3. Ingresar un email con formato incorrecto:
   - Email: `correo-invalido`
   - Contraseña: `cualquiera`
4. Hacer clic en "Ingresar"

### Resultado Esperado:
- ✅ Se muestra error de validación en el campo email
- ✅ No se envía la petición al servidor

---

## Caso de Prueba 6: Login con Credenciales Incorrectas
**Objetivo:** Verificar el manejo de errores cuando las credenciales son incorrectas.

### Pasos:
1. Navegar a `http://localhost:5173/ingresar`
2. Ingresar credenciales incorrectas:
   - Email: `maria.gonzalez@fing.edu.uy`
   - Contraseña: `ContraseñaIncorrecta123` (incorrecta)
3. Hacer clic en "Ingresar"

### Resultado Esperado:
- ✅ Se muestra un **mensaje de error genérico** en un recuadro rojo:
  - "Email o contraseña incorrectos. Por favor, verifica tus datos."
- ✅ El error aparece sobre el botón de envío
- ✅ No se especifica cuál dato es incorrecto (por seguridad)

---

## Caso de Prueba 7: Login Exitoso
**Objetivo:** Iniciar sesión correctamente con las credenciales del usuario creado.

### Pasos:
1. Navegar a `http://localhost:5173/ingresar`
2. Ingresar las credenciales correctas del usuario creado en el Caso de Prueba 3:
   - Email: `maria.gonzalez@fing.edu.uy`
   - Contraseña: `SecurePass2025!`
3. Hacer clic en "Ingresar"

### Resultado Esperado:
- ✅ El usuario es redirigido a `/panel`
- ✅ Se muestra la página del panel con el mensaje de bienvenida
- ✅ El token de autenticación se guarda en `localStorage`

---

## Caso de Prueba 8: Acceso a Ruta Protegida Después de Login
**Objetivo:** Verificar que después de iniciar sesión se puede acceder a rutas protegidas.

### Pasos:
1. Con la sesión activa del Caso de Prueba 7, navegar a `http://localhost:5173/panel`
2. Refrescar la página (F5)

### Resultado Esperado:
- ✅ Se muestra la página del panel correctamente
- ✅ No hay redirección a login
- ✅ La sesión persiste después de refrescar
- ✅ Se puede ver la información del usuario

---

## Resumen de Características Demostradas

### ✅ Seguridad
- Rutas protegidas con redirección automática
- Tokens JWT almacenados en localStorage
- Mensajes de error genéricos para proteger información sensible

### ✅ Validación
- Validación del lado del cliente antes de enviar al servidor
- Validación con Zod Schema
- Errores específicos por campo
- Validación de coincidencia de contraseñas

### ✅ Experiencia de Usuario
- Mensajes claros y en español
- Estados de carga en botones
- Limpieza automática de errores al escribir
- Alertas de éxito después de registro
- Redirección inteligente después de login

### ✅ Manejo de Errores
- Errores de validación (cliente)
- Errores 4xx (credenciales incorrectas, email duplicado)
- Errores 5xx (servidor no disponible)