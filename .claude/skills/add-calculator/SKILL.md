---
name: add-calculator
description: Añade calculadora a Calculators route. Form con inputs + función pura + display resultado. Ej. "calculadora ABV", "conversión fresco-seco".
allowed-tools: Read, Write, Edit
---

# add-calculator

## Pasos

1. Crear archivo `src/components/calculators/<Name>Calc.tsx`:
   ```tsx
   import { useState } from 'react';

   export function <Name>Calc() {
     const [input, setInput] = useState('');
     const result = compute(input);
     return (
       <div className="p-4 border border-border rounded">
         <h3>...</h3>
         <input ... onChange={e => setInput(e.target.value)} />
         <div>Resultado: {result}</div>
       </div>
     );
   }

   function compute(input: string): number { ... }
   ```

2. Importar en `src/routes/Calculators.tsx` y renderizar
3. Test cases en `src/components/calculators/<Name>.test.ts` (cuando vitest esté setup)
4. Commit

## Calculadoras planificadas

- Conversión fresco→seco (factor 5x setas/trufas, 4-5x cannabis)
- Dosis por peso corporal
- ABV homebrew: `(DI - DF) × 131.25`
- Nutrientes ml/L (Bio·Bizz, GHE)
- Decarboxilación cannabis (tiempo + temp → eficiencia %)
- Lemon tek timing
- Cost-per-gram cosecha
- Mescalina % por especie + peso seco

## Convenciones

- Función `compute()` PURA. Sin side effects. Testeable
- Inputs validados antes de compute (NaN guard)
- Outputs formateados (toFixed(2), unidades visibles)
- Si calculadora compleja: dividir en helpers
