import {
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Input,
} from "@mui/material";
import { Box } from "@mui/system";
import { Buffer } from "buffer";
import { ethers } from "ethers";
import { useSnackbar } from "notistack";
import { useEffect, useState, useCallback } from "react";
import { Multicall } from "ethereum-multicall";
import abi from "./abi.json";
import { parseUnits } from "ethers/lib/utils";

const provider = new ethers.providers.InfuraProvider(1);
const multicall = new Multicall({
  ethersProvider: provider,
  tryAggregate: true,
});

const NFT_ADDRESS = "0xf2470e641a551D7Dbdf4B8D064Cf208edfB06586";
const nft = new ethers.Contract(NFT_ADDRESS, abi, provider);

function App() {
  const { enqueueSnackbar } = useSnackbar();

  const [handler, set_handler] = useState(null);
  const [tokenId, set_tokenId] = useState(null);
  const [totalSupply, set_totalSupply] = useState(null);

  const [signer, set_signer] = useState(null);
  const [isCheckingUnminted, set_isCheckingUnminted] = useState(false);
  const [minting, set_minting] = useState(false);
  const [unmintedTokenId, set_unmintedTokenId] = useState(null);
  const [base64Image, set_base64Image] = useState(null);

  const updateImage = useCallback(
    async (tokenId) => {
      try {
        const jsonDump = await nft.tokenURI(tokenId);
        const base64JsonDump = jsonDump.split(",").slice(1).join(",");
        const jsonMetadata = JSON.parse(
          Buffer.from(base64JsonDump, "base64").toString()
        );
        set_base64Image(jsonMetadata.image);
        set_tokenId(tokenId);
      } catch (e) {
        return;
      }
    },
    [set_base64Image, set_tokenId]
  );

  const onTextUpdate = async (number) => {
    if (handler) {
      clearTimeout(handler);
    }

    set_base64Image(null);
    set_tokenId(number);
    set_handler(setTimeout(() => updateImage(number), 500));
  };

  // Updates token image
  useEffect(() => {
    if (base64Image !== null || tokenId !== null) return;
    const newTokenId = Math.floor(Math.random() * 7000);
    updateImage(newTokenId);
  });

  // Checks the latest total supply
  useEffect(() => {
    if (totalSupply !== null) return;
    const f = async () => {
      const data = await nft.totalSupply();
      set_totalSupply(data.toNumber());
    };
    f();
  }, [totalSupply]);

  // Gets unminted one
  useEffect(() => {
    if (isCheckingUnminted) return;
    if (unmintedTokenId !== null) return;

    set_isCheckingUnminted(true);

    const batchSize = 500;

    const f = async (startIndex) => {
      if (startIndex > 8000) {
        return;
      }

      const arr = Array(batchSize)
        .fill(0)
        .map((x, j) => startIndex + j)
        .filter((x) => x > 0 && x < 8001);
      const callContext = {
        reference: "clock8008",
        contractAddress: NFT_ADDRESS,
        abi,
        calls: arr.map((x) => {
          return {
            reference: `${x}`,
            methodName: "ownerOf",
            methodParameters: [x],
          };
        }),
        context: {},
      };
      const { results } = await multicall.call(callContext);
      const mintableIds = results.clock8008.callsReturnContext
        .filter((x) => !x.success)
        .map((x) => parseInt(x.reference));

      if (mintableIds.length === 0) {
        await f(startIndex + batchSize);
        return;
      } else {
        const selectedId =
          mintableIds[Math.floor(Math.random() * mintableIds.length)];
        set_unmintedTokenId(selectedId);
        set_isCheckingUnminted(false);
      }
    };

    f(1);
  }, [unmintedTokenId, isCheckingUnminted]);

  return (
    <Container>
      <Box sx={{ p: 2 }} />
      <Grid container spacing={0} direction="column" alignItems="center">
        <Grid item md={4}>
          <Typography variant="h4">🕒 Clock8008 🕒</Typography>
        </Grid>
      </Grid>
      <Box sx={{ p: 2 }} />

      <Grid container spacing={0} direction="column" alignItems="center">
        <Grid item md={4}>
          <Card variant="outlined" sx={{ maxWidth: 420 }}>
            <CardActionArea>
              {base64Image === null && (
                <div
                  style={{
                    width: "420px",
                    height: "420px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress />
                </div>
              )}
              {base64Image !== null && (
                <CardMedia
                  component="img"
                  height="420"
                  image={base64Image}
                  alt="clock"
                />
              )}
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Clock #
                  <Input
                    fullWidth={false}
                    onChange={(e) => onTextUpdate(e.target.value)}
                    style={{ font: "inherit" }}
                    value={tokenId === null ? "..." : tokenId}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clock8008 is a collection of 8008 functioning clocks that you
                  can own in the metaverse. Crafted with scrupulous attention to
                  detail, Clock8008 redefines timekeeping in the metaverse while
                  being a timeless staple.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Box sx={{ p: 2 }} />
          <Typography variant="h5">
            Public Minted: {totalSupply === null ? "..." : totalSupply - 1}/8000
          </Typography>
          <Button
            fullWidth
            variant="contained"
            disabled={minting || unmintedTokenId === null}
            onClick={async () => {
              let localSigner = signer;

              set_minting(true);
              if (localSigner === null) {
                // Try
                let web3Provider;
                try {
                  web3Provider = new ethers.providers.Web3Provider(
                    window.ethereum
                  );
                  await web3Provider.send("eth_requestAccounts", null);
                  localSigner = web3Provider.getSigner();
                  set_signer(localSigner);
                } catch (e) {
                  enqueueSnackbar(
                    "Failed to connect to web3, try installing metamask",
                    { variant: "error" }
                  );
                  return;
                }
              }

              // Mint!
              try {
                const tx = await nft
                  .connect(localSigner)
                  .mint(unmintedTokenId, { value: parseUnits("0.1") });
                enqueueSnackbar("Minting clock", { variant: "info" });
                await tx.wait();
                enqueueSnackbar("Clock minted!", { variant: "success" });
              } catch (e) {
                console.log("e", e);
                enqueueSnackbar("Failed to mint clock", { variant: "error" });
              }
              set_minting(false);
            }}
          >
            Mint Clock #{unmintedTokenId === null ? "..." : unmintedTokenId}
          </Button>

          <Box sx={{ p: 2 }} />
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "https://opensea.io/collection/clock-8008";
            }}
          >
            Opensea 🌊
          </Button>
          <Box sx={{ p: 1 }} />
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `https://etherscan.io/address/${NFT_ADDRESS}`;
            }}
          >
            Etherscan 🗿
          </Button>
          <Box sx={{ p: 1 }} />
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `https://twitter.com/nft8008`;
            }}
          >
            Twitter 🐦
          </Button>

          <Box sx={{ p: 1 }} />
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `https://discord.gg/4gT4T7BrUj`;
            }}
          >
            Discord 💬
          </Button>
        </Grid>
      </Grid>
      <Box sx={{ p: 2 }} />
    </Container>
  );
}

export default App;
