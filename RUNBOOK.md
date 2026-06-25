# Runbook — Échec du pipeline CI/CD sur le seuil de couverture de code

## Contexte

Ce runbook s'applique au projet **tasklist-backend**, une API REST Node.js/Express utilisant Prisma ORM (MySQL), déployée via Docker et intégrée à un pipeline GitHub Actions avec analyse SonarQube.

---

## 1. Problème traité

Le job GitHub Actions `Build and analyze` (`.github/workflows/build.yml`) échoue à l'étape `npm run test:coverage`.

Le seuil de couverture configuré dans `vitest.config.ts` est fixé à **80%** sur les quatre métriques :
- Lignes (`lines`)
- Instructions (`statements`)
- Branches (`branches`)
- Fonctions (`functions`)

Lorsqu'un commit pousse du code non couvert sur `main`, cette étape plante et l'analyse SonarQube ne s'exécute jamais (étape suivante non atteinte).

---

## 2. Symptômes

- Le pipeline GitHub Actions est **rouge** sur la branche `main`
- Message d'erreur dans les logs CI :
  ```
  ERROR: Coverage for lines (XX%) does not meet global threshold (80%)
  ```
- Le rapport SonarQube n'est **pas mis à jour**
- Les autres développeurs sont potentiellement **bloqués** si la branche `main` est protégée

---

## 3. Qui doit utiliser ce runbook

- Le **développeur** ayant pushé le commit fautif sur `main`
- Le **mainteneur du dépôt** si ce développeur est indisponible

---

## 4. Quand l'appliquer

**Immédiatement (J+0).**

Un pipeline cassé sur `main` bloque tous les retours qualité (SonarQube) et potentiellement le déploiement. Plus on attend, plus d'autres commits s'accumulent et compliquent l'identification de la cause.

---

## 5. Quand NE PAS l'appliquer

| Situation | Action à faire à la place |
|---|---|
| La baisse de couverture est **intentionnelle** (refactoring, suppression de code mort validée en équipe) | Modifier le seuil dans `vitest.config.ts` de manière concertée |
| Une **autre cause** explique l'échec (`npm ci` qui plante, secret `SONAR_TOKEN` expiré, etc.) | Investiguer la vraie cause avant de toucher aux tests |
| Le code non couvert est un **spike temporaire** non destiné à être mergé | Fermer la PR et ne pas merger sur `main` |

---

## 6. Étapes à suivre

### Étape 1 — Identifier le commit fautif

Aller dans GitHub Actions :
```
Repository > Actions > Build and analyze > logs de l'étape "Run unit tests with coverage"
```

Noter :
- Le pourcentage affiché pour chaque métrique
- Le ou les fichiers incriminés

---

### Étape 2 — Reproduire en local

```powershell
npm run test:coverage
```

Ouvrir le rapport HTML généré :
```
coverage/index.html
```

Ce rapport affiche en rouge les lignes, branches et fonctions non couvertes, fichier par fichier.

---

### Étape 3 — Identifier les fichiers sous le seuil

Les fichiers à risque sont typiquement dans :

```
src/services/task.service.ts
src/controllers/task.controller.ts
```

Chercher les cas non testés : erreurs catchées, branches conditionnelles, cas limites.

---

### Étape 4 — Écrire les tests manquants

Ajouter les cas de test dans les fichiers existants :

```
src/__tests__/unit/task.service.test.ts
src/__tests__/unit/task.controller.test.ts
```

Ou créer de nouveaux fichiers de test unitaire dans :
```
src/__tests__/unit/
```

Pour les flux complets (API → base de données), utiliser les tests e2e :
```
src/__tests__/e2e/task.e2e.test.ts
```

---

### Étape 5 — Vérifier le seuil localement

Relancer la couverture et s'assurer que **toutes les métriques sont ≥ 80%** avant de pousser :

```powershell
npm run test:coverage
```

Résultat attendu (aucune erreur de seuil) :
```
✓ All files | Lines: 82% | Statements: 81% | Branches: 80% | Functions: 85%
```

---

### Étape 6 — Pousser le correctif

```powershell
git add src/__tests__/...
git commit -m "test: add missing coverage for [nom du fichier]"
git push origin main
```

---

### Étape 7 — Vérifier le pipeline

Surveiller le job GitHub Actions. Toutes les étapes doivent repasser au vert :

1. ✅ Install dependencies
2. ✅ Run unit tests with coverage
3. ✅ SonarQube Scan

Vérifier ensuite que le tableau de bord SonarQube est bien mis à jour avec la nouvelle analyse.

---

## 7. Références

| Ressource | Chemin |
|---|---|
| Pipeline CI/CD | `.github/workflows/build.yml` |
| Configuration des seuils | `vitest.config.ts` |
| Tests unitaires | `src/__tests__/unit/` |
| Tests e2e | `src/__tests__/e2e/` |
| Rapport de couverture (local) | `coverage/index.html` |
