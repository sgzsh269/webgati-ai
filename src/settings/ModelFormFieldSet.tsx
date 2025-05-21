import React from "react";
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Group,
  NumberInput,
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
  const formFieldModels = `${modelProvider}.chatModels`;
  const models = form.values[modelProvider].chatModels || [];

  const addModel = () => {
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
              description="Label for display"
              required
              {...form.getInputProps(`${formFieldModels}.${index}.label`)}
            />
            <TextInput
              label="Model Name"
              description="Model Name from Provider API"
              required
              {...form.getInputProps(`${formFieldModels}.${index}.modelName`)}
            />
            <NumberInput
              label="Temperature"
              description="Measure of randomness/creativity, 0 means deterministic."
              placeholder="0"
              required
              {...form.getInputProps(`${formFieldModels}.${index}.temperature`)}
            />
            <NumberInput
              label="Max Output Tokens"
              description="Max number of tokens to generate, leave blank for default."
              {...form.getInputProps(
                `${formFieldModels}.${index}.maxOutputTokens`
              )}
            />

            <Checkbox
              label="Has Vision"
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
