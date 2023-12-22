import React from "react";
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { ModelProvider } from "../utils/types";

interface ModelFormFieldSetProps {
  form: any;
  modelProvider: ModelProvider;
}

export function ModelFormFieldSet({
  form,
  modelProvider,
}: ModelFormFieldSetProps): JSX.Element {
  const formFieldModels = `${modelProvider}.models`;
  const models = form.values[modelProvider].models || [];

  console.log("form", form.values);

  const addModel = () => {
    console.log(formFieldModels);
    form.insertListItem(formFieldModels, { label: "", modelName: "" });
  };

  const removeModel = (index: number) => {
    form.removeListItem(formFieldModels, index);
  };

  return (
    <Stack>
      <Text size="sm">Add Models</Text>
      {models.map((_: any, index: number) => (
        <Card key={index} bg="transparent" p="md" withBorder>
          <Card.Section p="xs" withBorder>
            <Group position="apart">
              <Text size="sm">Model #{index + 1}</Text>
              <ActionIcon onClick={() => removeModel(index)}>
                <IconX size={16} color="red" />
              </ActionIcon>
            </Group>
          </Card.Section>
          <Stack spacing="sm">
            <TextInput
              label="Label"
              placeholder="Label for display"
              required
              {...form.getInputProps(`${formFieldModels}.${index}.label`)}
            />
            <TextInput
              label="Model Name"
              placeholder="Model Name from Provider API"
              required
              {...form.getInputProps(`${formFieldModels}.${index}.modelName`)}
            />
            <Checkbox
              label="Vision"
              {...form.getInputProps(`${formFieldModels}.${index}.hasVision`, {
                type: "checkbox",
              })}
            />
          </Stack>
        </Card>
      ))}
      <Button variant="outline" color="blue" onClick={addModel}>
        Add Model
      </Button>
    </Stack>
  );
}
