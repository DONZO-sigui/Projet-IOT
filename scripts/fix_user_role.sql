-- Script pour vérifier et corriger le rôle utilisateur

-- 1. Vérifier les utilisateurs existants et leurs rôles
SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- 2. Mettre à jour le rôle d'un utilisateur spécifique vers 'admin'
-- Remplacez 'votre_username' par le nom d'utilisateur concerné
UPDATE users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
WHERE username = 'votre_username';

-- 3. Vérifier la mise à jour
SELECT id, username, email, role, updated_at 
FROM users 
WHERE username = 'votre_username';

-- 4. Alternative: Mettre à jour par ID
-- UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP WHERE id = 1;
