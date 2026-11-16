# Preferencias de trabajo

## Agentes (roles) en paralelo y en conjunto
- Cuando sea posible o necesario, los agentes pueden trabajar en paralelo o en conjunto, no solo de a uno.
- **Paralelo:** si una tarea se puede dividir en partes independientes (que no necesiten el resultado de la otra ni escriban los mismos archivos), lanza esos agentes a la vez, en un solo mensaje con varias llamadas a Agent.
- **En conjunto:** si dos roles deben coordinarse (por ejemplo, backend y frontend acordando el contrato de la API), fija primero el contrato compartido (rutas, formatos, nombres) y pásaselo a ambos en el mismo mensaje; lanza a los dos a la vez, y cuando terminen verifica que encajen antes de seguir.
- **En orden:** si un rol depende del resultado de otro (el frontend necesita el `api.js` del backend), respeta el orden y no los pongas en paralelo.
- **Si el usuario pide un orden explícito** (por ejemplo "uno por uno", "en orden"), eso manda sobre esta preferencia y se sigue al pie de la letra.
- Dos agentes nunca deben editar el mismo archivo al mismo tiempo.
- Antes de cada invocación, di el nombre del rol (o roles, si van en paralelo o en conjunto).

## Oficina virtual de Herdr
- Los subagentes se muestran en la oficina de Herdr gracias a los hooks `equipo-estado.js` (settings.json) y al mod `gengar-office`: los 13 roles siempre están en la oficina: el activo se sienta en un escritorio (a la izquierda) y los que no trabajan duermen en el sillón (a la derecha). El Orquestador lleva una batuta como accesorio.
- Cada rol usa el mismo accesorio en el panel "Equipo" y en la oficina (frontend: código; backend: casco; innovación: bombilla).
- Si cambias el mod, haz copia `.bak`, corre `herdr-app check mods/gengar-office` y no lo des por terminado sin que pase.
