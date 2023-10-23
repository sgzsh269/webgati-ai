import React from "react";
import { Badge, Group, Text } from "@mantine/core";
import { IconAsterisk } from "@tabler/icons-react";
import { APP_NAME } from "../utils/constants";

export function Logo(): JSX.Element {
  return (
    <Group align="center" spacing={4}>
      <IconAsterisk size="16px" />
      <Text weight="bold">{APP_NAME}</Text>
      <Badge color="yellow" size="sm">
        BETA
      </Badge>
    </Group>
  );
}
