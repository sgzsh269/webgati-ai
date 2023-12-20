import React, { useRef } from "react";
import { Box, Button, Grid, Stack, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useEffect } from "react";
import { STORAGE_FIELD_OPENAI } from "../utils/constants";
import { OpenAIForm } from "./OpenAIForm";
import { ModelFormSubFormRef } from "../utils/types";
import { readModelProvider } from "../utils/storage";

export function ModelForm(): JSX.Element {
  const subFormRef = useRef<ModelFormSubFormRef>(null);

  const loadModelConfig = async () => {
    const modelProvider = await readModelProvider();
    form.setFieldValue("modelProvider", modelProvider || STORAGE_FIELD_OPENAI);
  };

  const form = useForm({
    initialValues: {
      modelProvider: STORAGE_FIELD_OPENAI,
      [STORAGE_FIELD_OPENAI]: {},
    },
  });

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
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack spacing="sm">
              <Select
                label="Choose Model Provider"
                placeholder="Choose Model Provider"
                data={[{ value: STORAGE_FIELD_OPENAI, label: "OpenAI" }]}
                required
                {...form.getInputProps("modelProvider")}
              />
              {form.values["modelProvider"] === STORAGE_FIELD_OPENAI && (
                <OpenAIForm form={form} ref={subFormRef} />
              )}
              <Button type="submit">Save</Button>
            </Stack>
          </form>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
