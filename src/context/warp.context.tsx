import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Warp, FromSrcTxContractData } from "warp-contracts";
import { ArweaveWebWallet } from "arweave-wallet-connector";
import { notifications } from "@mantine/notifications";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import {
  InjectedArweaveSigner,
  InjectedEthereumSigner,
} from "warp-contracts-plugin-deploy";
import { ethers } from "ethers";
import { SDK } from "hollowdb";
import { HOLLOWDB_SRCTXID } from "@/constants";

// instantiate Arweave Web Wallet
const arweaveWebWallet = new ArweaveWebWallet(
  {
    name: "HollowDB Tester",
    logo: "https://avatars.githubusercontent.com/u/107621806?s=200&v=4",
  },
  {
    state: {
      url: "arweave.app",
    },
  }
);

const generateContractInfo = (
  srcTxId: string,
  userAddr: string,
  signer: any
) => {
  const contractInfo = {
    srcTxId: srcTxId,
    wallet: signer,
    initState: JSON.stringify({
      owner: userAddr,
      verificationKey: null,
      isProofRequired: false,
      canEvolve: true,
      whitelist: {
        put: { [userAddr]: true },
        update: { [userAddr]: true },
      },
      isWhitelistRequired: {
        put: true,
        update: true,
      },
    }),
  };
  return contractInfo;
};

type WarpContextType = {
  hollowdb: SDK | undefined; // can add HollowDB state here
  isConnected: boolean;
  isLoading: boolean;
  address: string;
  connectArweave: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  disconnect: () => Promise<void>;
  deployContract: () => Promise<void>;
};
const WarpContext = createContext<WarpContextType>({
  hollowdb: undefined,
  isConnected: false,
  isLoading: false,
  address: "",
  connectArweave: async () => {},
  connectMetaMask: async () => {},
  disconnect: async () => {},
  deployContract: async () => {},
});

export const WarpContextProvider: FC<{
  children: ReactNode;
  warp: Warp;
}> = ({ children, warp }) => {
  // arweave
  const [arWallet, setArWallet] = useState<typeof arweaveWebWallet>();
  const isArweaveConnected = useMemo(
    () => (arWallet ? arWallet.connected : false),
    [arWallet]
  );
  // wagmi
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
  const { connect: wagmiConnect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect: wagmiDisconnect } = useDisconnect();
  // common
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const isConnected = isArweaveConnected || isWagmiConnected;
  // contracts
  const [hollowdb, setHollowdb] = useState<SDK>();

  // Check for previously deployed contract
  useEffect(() => {
    const checkContract = async () => {
      const addr = localStorage.getItem("contractAddress");
      if (addr) {
        let connectType: any;
        if (isArweaveConnected) {
          connectType = "use_wallet";
        } else {
          connectType = {
            signer: (await import("warp-contracts-plugin-signature"))
              .evmSignature,
            type: "ethereum",
          };
        }
        const hollowdb = new SDK(connectType, addr, warp);
        setHollowdb(hollowdb);
      }
    };
    checkContract();
  }, [address]);

  // update address automatically
  useEffect(() => {
    if (arWallet && arWallet.address) {
      setAddress(arWallet.address);
    } else if (wagmiAddress) {
      setAddress(wagmiAddress);
    }
  }, [arWallet, wagmiAddress]);

  async function deployArweave() {
    const userSigner = new InjectedArweaveSigner(arweaveWebWallet);
    await userSigner.setPublicKey();

    const srcTx: FromSrcTxContractData = generateContractInfo(
      HOLLOWDB_SRCTXID,
      address,
      userSigner
    );
    const deployTx = await warp.deployFromSourceTx(srcTx);
    const hollowdb = new SDK("use_wallet", deployTx.contractTxId, warp);
    setHollowdb(hollowdb);

    if (hollowdb.contractTxId) {
      localStorage.setItem("contractAddress", hollowdb.contractTxId);
      notifications.show({
        title: "Deployed",
        message: "Successfully deployed a HollowDB contract.",
        color: "green",
      });
    } else {
      notifications.show({
        title: "Error",
        message: "There was an error uploading the contract.",
        color: "red",
      });
    }
  }
  async function deployMetamask() {
    await window.ethereum?.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const userSigner = new InjectedEthereumSigner(provider);
    await userSigner.setPublicKey();

    const srcTx: FromSrcTxContractData = generateContractInfo(
      HOLLOWDB_SRCTXID,
      address,
      userSigner
    );
    const deployTx = await warp.deployFromSourceTx(srcTx);
    const hollowdb = new SDK(
      {
        // you need to do this lazily, otherwise you get "SubtleCrypto undefined" error
        signer: (await import("warp-contracts-plugin-signature")).evmSignature,
        type: "ethereum",
      },
      deployTx.contractTxId,
      warp
    );

    setHollowdb(hollowdb);

    if (hollowdb.contractTxId) {
      localStorage.setItem("contractAddress", hollowdb.contractTxId);
      notifications.show({
        title: "Deployed",
        message: "Successfully deployed a HollowDB contract.",
        color: "green",
      });
    } else {
      notifications.show({
        title: "Error",
        message: "There was an error uploading the contract.",
        color: "red",
      });
    }
  }

  async function deployContract() {
    if (isWagmiConnected) {
      return await deployMetamask();
    } else if (isArweaveConnected) {
      return await deployArweave();
    }
    notifications.show({
      title: "Wallet not connected",
      message: "Connect your wallet first.",
      color: "red",
    });
  }

  async function connectArweave() {
    if (isWagmiConnected) {
      return notifications.show({
        title: "Already connected",
        message: "You are already connected with MetaMask.",
        color: "red",
      });
    }
    setIsLoading(true);

    await arweaveWebWallet.connect();
    setArWallet(arweaveWebWallet);

    const hollowdb = new SDK("use_wallet", "", warp);
    setHollowdb(hollowdb);

    setIsLoading(false);
    notifications.show({
      title: "Connected",
      message: "Successfully connected to Arweave.",
      color: "green",
    });
  }

  async function connectMetaMask() {
    if (isArweaveConnected) {
      return notifications.show({
        title: "Already connected",
        message: "You are already connected to Arweave.",
        color: "red",
      });
    }
    setIsLoading(true);
    wagmiConnect();

    const hollowdb = new SDK(
      {
        signer: (await import("warp-contracts-plugin-signature")).evmSignature,
        type: "ethereum",
      },
      "",
      warp
    );

    setHollowdb(hollowdb);
    setIsLoading(false);
    notifications.show({
      title: "Connected!",
      message: "Successfully connected to MetaMask.",
      color: "green",
    });
  }

  async function disconnect() {
    if (isWagmiConnected) {
      wagmiDisconnect();
    }
    if (isArweaveConnected) {
      await arweaveWebWallet.disconnect();
      setArWallet(undefined);
    }
    setHollowdb(undefined);
    setAddress("");
  }

  return (
    <WarpContext.Provider
      value={{
        hollowdb,
        isLoading,
        isConnected,
        address,
        connectArweave,
        connectMetaMask,
        disconnect,
        deployContract,
      }}
    >
      {children}
    </WarpContext.Provider>
  );
};

export function useWarpContext() {
  return useContext(WarpContext);
}
