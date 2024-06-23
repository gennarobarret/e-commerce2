// cookieHelper.js

/**
 * Establece una cookie HttpOnly en la respuesta.
 * @param {Response} res - Objeto de respuesta de Express.
 * @param {string} name - Nombre de la cookie.
 * @param {string} value - Valor de la cookie.
 * @param {number} [maxAge=3600000] - Tiempo de vida de la cookie en milisegundos.
 */
function setHttpOnlyCookie(res, name, value, maxAge = 3600000) {
    res.cookie(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Asegura que se use en producción.
        maxAge: maxAge,
        sameSite: 'strict', // Opcional: Configura según tus necesidades de seguridad
    });
}

/**
 * Limpia una cookie especificada por su nombre.
 * @param {Response} res - Objeto de respuesta de Express.
 * @param {string} name - Nombre de la cookie a limpiar.
 */
function clearHttpOnlyCookie(res, name) {
    res.cookie(name, '', { expires: new Date(0), httpOnly: true, secure: process.env.NODE_ENV === 'production' });
}

module.exports = {
    setHttpOnlyCookie,
    clearHttpOnlyCookie,
};
