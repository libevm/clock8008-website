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
} from "@mui/material";
import { Box } from "@mui/system";
import { Buffer } from "buffer";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import abi from "./abi.json";

const NFT_ADDRESS = "0xf2470e641a551D7Dbdf4B8D064Cf208edfB06586";

function App() {
  const [tokenId, set_tokenId] = useState(null);
  const [base64Image, set_base64Image] = useState(null);

  useEffect(() => {
    if (base64Image !== null) return;

    const f = async () => {
      const provider = new ethers.providers.InfuraProvider();
      const nft = new ethers.Contract(NFT_ADDRESS, abi, provider);
      const tokenId = Math.floor(Math.random() * 7000);

      const jsonDump = await nft.tokenURI(tokenId);
      const base64JsonDump = jsonDump.split(",").slice(1).join(",");
      const jsonMetadata = JSON.parse(
        Buffer.from(base64JsonDump, "base64").toString()
      );
      set_base64Image(jsonMetadata.image);
      set_tokenId(tokenId);
    };
    f();
  });

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
                  Clock #{tokenId === null ? "..." : tokenId}
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
          <Button
            fullWidth
            variant="outlined"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "https://opensea.io/collection/clock8008";
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
        </Grid>
      </Grid>
      <Box sx={{ p: 2 }} />
    </Container>
  );
}

export default App;
