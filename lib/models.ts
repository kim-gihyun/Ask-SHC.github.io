// Verified against OpenRouter model catalogue on 2026-09-19.
export const MODEL_CATALOG = [
  {
    "id": "qwen/qwen3.8-27b:free",
    "name": "Qwen: Qwen3.8 27B",
    "mandatoryReasoning": false
  },
  {
    "id": "google/gemma-4-31b-it:free",
    "name": "Google: Gemma 4 31B",
    "mandatoryReasoning": false
  },
  {
    "id": "inclusionai/ling-3.0-flash-vl:free",
    "name": "inclusionAI: Ling 3.0 Flash VL",
    "mandatoryReasoning": false
  },
  {
    "id": "nex-agi/nex-n2.5-mini:free",
    "name": "Nex AGI: Nex-N2.5-Mini",
    "mandatoryReasoning": false
  },
  {
    "id": "nex-agi/nex-n2.5-pro:free",
    "name": "Nex AGI: Nex-N2.5-Pro",
    "mandatoryReasoning": false
  },
  {
    "id": "inclusionai/ling-3.0-flash-sante:free",
    "name": "inclusionAI: Ling 3.0 Flash Sante",
    "mandatoryReasoning": false
  },
  {
    "id": "inclusionai/ling-3.0-flash-fin:free",
    "name": "inclusionAI: Ling 3.0 Flash Fin",
    "mandatoryReasoning": false
  },
  {
    "id": "dots-studio/dots-3-note-preview:free",
    "name": "Dots Studio: Dots3-Note Preview",
    "mandatoryReasoning": false
  },
  {
    "id": "liquid/lfm-2.5-2.6b:free",
    "name": "LiquidAI: LFM2.5-2.6B",
    "mandatoryReasoning": true
  },
  {
    "id": "nvidia/nemotron-3.5-lightning:free",
    "name": "NVIDIA: Nemotron 3.5 Lightning",
    "mandatoryReasoning": false
  },
  {
    "id": "deepseek/deepseek-v4-flash-0731:free",
    "name": "DeepSeek: DeepSeek V4 Flash 0731",
    "mandatoryReasoning": false
  },
  {
    "id": "thinkingmachines/inkling-small:free",
    "name": "Thinking Machines: Inkling Small",
    "mandatoryReasoning": false
  },
  {
    "id": "poolside/laguna-s-2.1:free",
    "name": "Poolside: Laguna S 2.1",
    "mandatoryReasoning": false
  },
  {
    "id": "thinkingmachines/inkling:free",
    "name": "Thinking Machines: Inkling",
    "mandatoryReasoning": false
  },
  {
    "id": "poolside/laguna-xs-2.1:free",
    "name": "Poolside: Laguna XS 2.1",
    "mandatoryReasoning": false
  },
  {
    "id": "cohere/north-mini-code:free",
    "name": "Cohere: North Mini Code",
    "mandatoryReasoning": false
  },
  {
    "id": "z-ai/glm-5.2:free",
    "name": "Z.ai: GLM 5.2",
    "mandatoryReasoning": false
  },
  {
    "id": "nvidia/nemotron-3-ultra-550b-a55b:free",
    "name": "NVIDIA: Nemotron 3 Ultra",
    "mandatoryReasoning": false
  },
  {
    "id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "name": "NVIDIA: Nemotron 3 Nano Omni",
    "mandatoryReasoning": false
  },
  {
    "id": "google/gemma-4-26b-a4b-it:free",
    "name": "Google: Gemma 4 26B A4B",
    "mandatoryReasoning": false
  },
  {
    "id": "nvidia/nemotron-3-super-120b-a12b:free",
    "name": "NVIDIA: Nemotron 3 Super",
    "mandatoryReasoning": false
  }
] as const;
export const FREE_MODELS: readonly string[] = MODEL_CATALOG.map(m=>m.id);
export function modelName(id:string){return MODEL_CATALOG.find(m=>m.id===id)?.name||id;}
