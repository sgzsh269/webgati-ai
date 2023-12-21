import React, { useRef } from "react";
import { Box, Button, Grid, Stack, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useEffect } from "react";
import {
  AI_MODEL_CONFIG_DEFAULT,
  MODEL_PROVIDER_ANTHROPIC,
  MODEL_PROVIDER_OLLAMA,
  MODEL_PROVIDER_OPENAI,
} from "../utils/constants";
import { ModelFormSubFormRef, ModelProvider } from "../utils/types";
import { readAIModelConfig } from "../utils/storage";
import { ModelFormFields } from "./ModelFormFields";
import { OpenAIFormFields } from "./OpenAIFormFields";
import { AnthropicFormFields } from "./AnthropicFormFields";
import { OllamaFormFields } from "./OllamaFormFields";

export function ModelForm(): JSX.Element {
  const subFormRef = useRef<ModelFormSubFormRef>(null);
  const [modelProvider, setModelProvider] = React.useState<ModelProvider>();

  const form = useForm({
    initialValues: AI_MODEL_CONFIG_DEFAULT,
  });

  const loadModelConfig = async () => {
    const aiModelConfig = await readAIModelConfig();
    form.setValues(aiModelConfig || AI_MODEL_CONFIG_DEFAULT);
  };

  const handleSubmit = async () => {
    await subFormRef.current?.save();
    showNotification({
      message: "AI Model config saved!",
    });
  };

  useEffect(() => {
    loadModelConfig();
  }, []);

  return (
    <Box>
      <Grid>
        <Grid.Col span={4}>
          <Stack spacing="sm">
            <Select
              label="Configure Model Provider"
              placeholder="Configure Model Provider"
              data={[
                { value: MODEL_PROVIDER_OPENAI, label: "OpenAI" },
                { value: MODEL_PROVIDER_ANTHROPIC, label: "Anthropic" },
                { value: MODEL_PROVIDER_OLLAMA, label: "[Local] Ollama" },
              ]}
              value={modelProvider}
              onChange={(value: ModelProvider) => {
                setModelProvider(value);
              }}
              required
            />
            <form onSubmit={form.onSubmit(handleSubmit)}>
              {modelProvider === MODEL_PROVIDER_OPENAI && (
                <ModelFormFields
                  form={form}
                  ref={subFormRef}
                  modelProvider={MODEL_PROVIDER_OPENAI}
                  FormFieldsComponent={OpenAIFormFields}
                />
              )}
              {modelProvider === MODEL_PROVIDER_ANTHROPIC && (
                <ModelFormFields
                  form={form}
                  ref={subFormRef}
                  modelProvider={MODEL_PROVIDER_ANTHROPIC}
                  FormFieldsComponent={AnthropicFormFields}
                />
              )}
              {modelProvider === MODEL_PROVIDER_OLLAMA && (
                <ModelFormFields
                  form={form}
                  ref={subFormRef}
                  modelProvider={MODEL_PROVIDER_OLLAMA}
                  FormFieldsComponent={OllamaFormFields}
                />
              )}
              {modelProvider && <Button type="submit">Save</Button>}
            </form>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
