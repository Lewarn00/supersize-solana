import express from "express";
import { PrismaClient } from "@prisma/client";
import { returnParticipantInfo } from "./returnParticipantInfo";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

//@ts-ignore
app.post("/create-contest", async (req: express.Request, res: express.Response) => {
  const { name, tokenAddress } = req.body;
  await prisma.contests.create({
    data: { name, tokenAddress }
  });
  return res.json({ success: true });
});

//@ts-ignore
app.post("/create-user", async (req: express.Request, res: express.Response) => {
  const { walletAddress, name, contestId } = req.body;

  if (!walletAddress || !name) {
    return res.status(400).json({ error: "Wallet address and name are required" });
  }
  if (contestId !== "USDC" && contestId !== "SOL" && contestId !== "AGLD") {
    return res.status(400).json({ error: "Invalid contest ID" });
  }
  try {
    const user = await prisma.user.create({
    data: {
      walletAddress,
      name,
      contestId
    }
  });
    const winner = await prisma.winning.create({
      data: {
        userWalletAddress: walletAddress,
        id: user.id
      }
    });
    return res.json({ user, winner });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

//@ts-ignore
app.get("/get-user", async (req: express.Request, res: express.Response) => {
  const { user } = req.query;
  if (!user) {
    return res.status(400).json({ error: "User is required" });
  }
  try {
    const userRes = await prisma.user.findFirst({
      where: {
        OR: [
          {name: user as string},
          {walletAddress: user as string}
        ]
      }
    });
    if (!userRes) {
      return res.status(400).json({ error: "Contest not found" });
    } else {
      return res.json({ username: userRes.name, wallet: userRes.walletAddress });
    }
  } catch (error) {
    return res.status(500).json({ error: "Failed to get user" });
  }
})

//@ts-ignore
app.post("/update-wins", async (req: express.Request, res: express.Response) => {
  const { walletAddress, updateId, amount }: { walletAddress: string; updateId: string; amount: number } = req.body;
  if (!walletAddress || updateId !== "USDC" && updateId !== "SOL" && updateId !== "AGLD") {
    return res.status(400).json({ error: "Invalid request" });
  }
  console.log(walletAddress, updateId, amount);

  try {
    if (updateId === "USDC") {
      console.log("USDC");
      await prisma.winning.update({
        where: { userWalletAddress: walletAddress },
        data: {
          usdc: amount
        }
      })
      console.log("USDC updated");
    } else if (updateId === "SOL") {
      await prisma.winning.update({
        where: { userWalletAddress: walletAddress },
        data: {
          sol: amount
        }
      })
    } else if (updateId === "AGLD") {
      await prisma.winning.update({
        where: { userWalletAddress: walletAddress },
        data: {
          agld: amount
        }
      })

      return res.json({ success: true });

    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update wins" });
  } 
});

//@ts-ignore
app.get("/get-user-position", async (req: express.Request, res: express.Response) => {
  const { walletAddress, contestName } = req.query;

  if (!walletAddress || !contestName) {
    return res.status(400).json({ error: "Wallet address and contest name are required" });
  }

  try {
    const contest = await prisma.contests.findUnique({
      where: { name: contestName as string },
      include: {
        participants: {
          include: {
            winning: true
          }
        }
      }
    });
  
    if (!contest) {
      return res.status(400).json({ error: "Contest not found" });
    }

    const sortedParticipants = returnParticipantInfo(contest.participants, contest.name);

    const position = sortedParticipants.findIndex(p => p.walletAddress === walletAddress) + 1;

    if (position === 0) {
      return res.status(400).json({ error: "User not found in contest" });
    }

    const topParticipants = sortedParticipants.slice(0, 100);

    let points = 0;
    if (contest.name === "USDC") {
      points = sortedParticipants[position - 1].winning?.usdc || 0;
    } else if (contest.name === "SOL") {
      points = sortedParticipants[position - 1].winning?.sol || 0;
    } else if (contest.name === "AGLD") {
      points = sortedParticipants[position - 1].winning?.agld || 0;
    }
 
    return res.json({ 
      position,
      points,
      totalCandidates: contest.participants.length,
      topParticipants
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to get user position" });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});

