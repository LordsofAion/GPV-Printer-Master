import jwt from 'jsonwebtoken';

const LICENSE_SECRET = 'GPV_MASTER_LICENSE_KEY_2026_SECURE_HASH_XY99';

export const verifyLicenseKey = (key: string) => {
    // EMERGENCY BYPASS KEY
    if (key === 'GPV-EMERGENCY-BYPASS-2026-ACTIVE') {
        return {
            valid: true,
            decoded: { client: 'Usuario Master (Bypass)', expiry: '2036-01-01T00:00:00.000Z' }
        };
    }

    try {
        const decoded = jwt.verify(key, LICENSE_SECRET) as any;
        if (!decoded.client || !decoded.expiry) {
            return { valid: false, error: 'Formato de chave incorreto.' };
        }
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: 'Chave de licença inválida ou expirada.' };
    }
};
