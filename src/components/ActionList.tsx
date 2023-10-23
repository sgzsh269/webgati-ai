import React from "react";
import { Box, Stack, Sx } from "@mantine/core";
import { CopyWebpageMarkdown } from "./ActionButtons/CopyWebpageMarkdown";
import { AnalyzeWebpage } from "./ActionButtons/AnalyzeWebpage";
import { SummarizeWebPage } from "./ActionButtons/SummarizeWebpage";

interface ActionListProps {
  sx?: Sx;
}

export function ActionList({ sx }: ActionListProps): JSX.Element {
  return (
    <Box sx={sx}>
      <Stack spacing="xs">
        <AnalyzeWebpage />
        <CopyWebpageMarkdown />
        <SummarizeWebPage />
      </Stack>
    </Box>
  );
}
