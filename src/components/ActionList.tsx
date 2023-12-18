import React from "react";
import { Box, Stack, Sx } from "@mantine/core";
import { CopyWebpageMarkdown } from "./ActionButtons/CopyWebpageMarkdown";
import { AnalyzeWebpage } from "./ActionButtons/AnalyzeWebpage";
import { SummarizeWebPage } from "./ActionButtons/SummarizeWebpage";
import { QueryMode } from "../utils/types";

interface ActionListProps {
  sx?: Sx;
  queryMode: QueryMode;
}

export function ActionList({ sx, queryMode }: ActionListProps): JSX.Element {
  return (
    <Box sx={sx}>
      <Stack spacing="xs">
        {queryMode === "webpage-text-qa" && (
          <>
            <AnalyzeWebpage />
            <CopyWebpageMarkdown />
            <SummarizeWebPage />
          </>
        )}
      </Stack>
    </Box>
  );
}
