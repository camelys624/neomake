export interface ImageModelConfig { endpoint: string; apiKey: string }

type RuntimeEnv = Record<string, string | undefined>;

function resolveRuntimeEnv(): RuntimeEnv {
  const processEnv = typeof process === "undefined" ? undefined : process.env;
  const viteEnv = (import.meta as ImportMeta & { env?: RuntimeEnv }).env;
  if (processEnv) return processEnv;
  if (viteEnv) return viteEnv;
  return {};
}

function readEnvValue(env: RuntimeEnv, serverKey: "IMAGE_MODEL_ENDPOINT" | "IMAGE_MODEL_API_KEY", clientKey: "VITE_IMAGE_MODEL_ENDPOINT" | "VITE_IMAGE_MODEL_API_KEY") {
  return env[serverKey]?.trim() || env[clientKey]?.trim() || "";
}


export function getImageModelConfig(env: RuntimeEnv = resolveRuntimeEnv()): ImageModelConfig {
  const endpoint = readEnvValue(env, "IMAGE_MODEL_ENDPOINT", "VITE_IMAGE_MODEL_ENDPOINT");
  if (!endpoint) throw new Error("Missing IMAGE_MODEL_ENDPOINT");
  const apiKey = readEnvValue(env, "IMAGE_MODEL_API_KEY", "VITE_IMAGE_MODEL_API_KEY");
  if (!apiKey) throw new Error("Missing IMAGE_MODEL_API_KEY");
  return { endpoint, apiKey };
}
