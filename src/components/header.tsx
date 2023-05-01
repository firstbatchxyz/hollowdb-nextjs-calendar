import { useWarpContext } from "@/context/warp.context";
import {
  Box,
  Container,
  Text,
  Group,
  Code,
  Anchor,
  Title,
  Button,
  Popover,
  ActionIcon,
} from "@mantine/core";
import {
  IconCircleLetterA,
  IconCurrencyEthereum,
  IconFileText,
  IconWallet,
  IconWalletOff,
} from "@tabler/icons-react";
import type { FC } from "react";
import { resetEventId } from "@/pages";

const Header: FC = () => {
  const {
    address,
    disconnect,
    isConnected,
    isLoading,
    connectArweave,
    connectMetaMask,
    hollowdb,
    deployContract,
  } = useWarpContext();

  const shortAddress = address
    ? address.slice(0, 6) + "..." + address.slice(-6)
    : "Connect Wallet";

  return (
    <Box component="header" py="md">
      <Container>
        <Group align="center">
          <Title order={1}>Calendar</Title>
          <Text fz="xs" fw={700}>
            Powered by HollowDB
          </Text>
          {/* pushes the succeeding contents to the right */}
          <span style={{ flexGrow: 1 }} />
          <Code>{shortAddress}</Code>
          {isConnected ? (
            <ActionIcon onClick={() => disconnect()}>
              <IconWalletOff />
            </ActionIcon>
          ) : (
            <Popover width={200} position="bottom" withArrow shadow="md">
              <Popover.Target>
                <ActionIcon>
                  <IconWallet />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Group position="center">
                  <ActionIcon
                    disabled={isLoading || isConnected}
                    onClick={() => {
                      connectArweave();
                    }}
                  >
                    <IconCircleLetterA size="2.5rem" color="black" />
                  </ActionIcon>
                  <ActionIcon
                    disabled={isLoading || isConnected}
                    onClick={() => {
                      connectMetaMask();
                    }}
                  >
                    <IconCurrencyEthereum size="2.5rem" color="gray" />
                  </ActionIcon>
                </Group>
              </Popover.Dropdown>
            </Popover>
          )}
          {hollowdb?.contractTxId && isConnected && (
            <Group>
              <Anchor
                href={
                  "https://sonar.warp.cc/#/app/contract/" +
                  hollowdb?.contractTxId
                }
                target="_blank"
              >
                <ActionIcon>
                  <IconFileText />
                </ActionIcon>
              </Anchor>
              <Button
                disabled={!isConnected || isLoading}
                onClick={() => {
                  resetEventId();
                  deployContract();
                }}
              >
                Redeploy
              </Button>
            </Group>
          )}
          {!hollowdb?.contractTxId && isConnected && (
            <Button
              disabled={!isConnected || isLoading}
              onClick={() => deployContract()}
            >
              Deploy Contract
            </Button>
          )}
        </Group>
      </Container>
    </Box>
  );
};

export default Header;
