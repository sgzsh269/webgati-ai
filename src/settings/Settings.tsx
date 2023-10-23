import React from "react";
import {
  AppShell,
  Header,
  Navbar,
  NavLink as MantineNavLink,
  Text,
  Group,
} from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { Route, Routes, NavLink } from "react-router-dom";
import { Logo } from "../components/Logo";
import { ModelForm } from "./ModelForm";

const data = [
  {
    icon: <IconSparkles size="16px" />,
    color: "blue",
    label: "AI Model",
    path: "/",
  },
];

export function MainLinks(): JSX.Element {
  const links = data.map((link) => (
    <NavLink
      key={link.path}
      to={link.path}
      style={{
        textDecoration: "none",
      }}
    >
      {({ isActive }) => (
        <MantineNavLink
          {...link}
          key={link.label}
          component="div"
          active={isActive}
        />
      )}
    </NavLink>
  ));
  return <div>{links}</div>;
}

export default function Settings(): JSX.Element {
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  return (
    <AppShell
      padding="md"
      fixed={false}
      navbar={
        <Navbar width={{ base: "200px" }} p="xs">
          <Navbar.Section grow mt="xs">
            <MainLinks />
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={48}>
          <Group sx={{ padding: "8px" }}>
            <Logo />
            <Text>v{version}</Text>
          </Group>
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
    >
      <Routes>
        <Route path="/" element={<ModelForm />}></Route>
      </Routes>
    </AppShell>
  );
}
