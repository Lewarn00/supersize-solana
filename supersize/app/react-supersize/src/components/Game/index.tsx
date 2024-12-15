import React, { useEffect, useRef, useState } from 'react';
import {PublicKey} from "@solana/web3.js";
import BN from 'bn.js';

const foodImage = new Image();
const foodImage2 = new Image();
const foodImage3 = new Image();
const foodImage4 = new Image();
const foodImage5 = new Image();
const foodImage6 = new Image();
const foodImage7 = new Image();
const foodImage8 = new Image();
const foodImage9 = new Image();
const foodImage10 = new Image();
const foodImage11 = new Image();
const foodImage12 = new Image();
const foodImage13 = new Image();
const foodImage14 = new Image();
const foodImage15 = new Image();

foodImage.src = `${process.env.PUBLIC_URL}/coin.png`; 
foodImage2.src = `${process.env.PUBLIC_URL}/coin2o.png`; 
foodImage3.src = `${process.env.PUBLIC_URL}/coin3o.png`; 
foodImage4.src = `${process.env.PUBLIC_URL}/coin4o.png`; 
foodImage5.src = `${process.env.PUBLIC_URL}/coin5o.png`; 
foodImage6.src = `${process.env.PUBLIC_URL}/coin6o.png`; 
foodImage7.src = `${process.env.PUBLIC_URL}/coin7o.png`; 
foodImage8.src = `${process.env.PUBLIC_URL}/coin8o.png`; 
foodImage9.src = `${process.env.PUBLIC_URL}/coin9o.png`; 
foodImage10.src = `${process.env.PUBLIC_URL}/coin10o.png`; 
foodImage11.src = `${process.env.PUBLIC_URL}/coin11o.png`; 
foodImage12.src = `${process.env.PUBLIC_URL}/coin12o.png`; 
foodImage13.src = `${process.env.PUBLIC_URL}/coin13o.png`; 
foodImage14.src = `${process.env.PUBLIC_URL}/coin14o.png`; 
foodImage15.src = `${process.env.PUBLIC_URL}/coin15o.png`; 

const foodImages = [
  foodImage,  // Size 1
  foodImage2, // Size 2
  foodImage3, // Size 3
  foodImage4, // Size 4
  foodImage5, // Size 5
  foodImage6, // Size 6
  foodImage7, // Size 7
  foodImage8, // Size 8
  foodImage9, // Size 9
  foodImage10, // Size 10
  foodImage11, // Size 11
  foodImage12, // Size 12
  foodImage13, // Size 13
  foodImage14, // Size 14
  foodImage15, // Size 15
];

const playerImage = new Image();
const playerImage2 = new Image();
const playerImage3 = new Image();
const playerImage4 = new Image();
const playerImage5 = new Image();
const playerImage6 = new Image();
const playerImage7 = new Image();
const playerImage8 = new Image();

playerImage.src = `${process.env.PUBLIC_URL}/up.png`; 
playerImage2.src = `${process.env.PUBLIC_URL}/down.png`; 
playerImage3.src = `${process.env.PUBLIC_URL}/up-right.png`; 
playerImage4.src = `${process.env.PUBLIC_URL}/up-left.png`; 
playerImage5.src = `${process.env.PUBLIC_URL}/down-right.png`; 
playerImage6.src = `${process.env.PUBLIC_URL}/down-left.png`; 
playerImage7.src = `${process.env.PUBLIC_URL}/side-right3.png`; 
playerImage8.src = `${process.env.PUBLIC_URL}/side-left3.png`; 

const playerImages = [
  playerImage,  
  playerImage2, 
  playerImage3, 
  playerImage4, 
  playerImage5, 
  playerImage6, 
  playerImage7, 
  playerImage8, 
];

interface Blob {
    name: string;
    authority: PublicKey | null;
    x: number;
    y: number;
    radius: number;
    mass: number;
    score: number;
    speed: number;
    removal: BN;
    target_x: number;
    target_y: number;
}

interface Food {
  x: number;
  y: number;
  size: number;
}

interface GameComponentProps {
  gameId: PublicKey | null;
  players: Blob[];
  visibleFood: Food[];
  currentPlayer: Blob | null;
  screenSize: { width: number; height: number };
  scale: number;
}

const GameComponent: React.FC<GameComponentProps> = ({ gameId, players, visibleFood, currentPlayer, screenSize, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lastTime, setLastTime] = useState<number>(0);
  const playersRef = useRef(players);
  const foodRef = useRef(visibleFood);

  const timeStep = 30.0;  //1000.0 / 60.0;  

  const previousTime = useRef(0.0);
  const delta = useRef(0.0);
  const accumulator = useRef(0.0);
  
  const currentPlayerRef = useRef(currentPlayer);
  const previousPlayerPos = useRef(currentPlayerRef.current);
  const previousPlayersRef = useRef<Blob[]>([]);

  useEffect(() => {
    foodRef.current = visibleFood; 
  }, [visibleFood]);

  useEffect(() => {
    if (players.length > 0) {
      //previousPlayersRef.current = playersRef.current.map(player => ({ ...player }));
      playersRef.current = players;
    }
  }, [players]);
  
  const restartTimer = () => {
    //previousTime.current = performance.now();  
    delta.current = 0.0;
    accumulator.current = 0.0;  
  };
  
  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
    playersRef.current = players;
    foodRef.current = visibleFood;
    //console.log(currentPlayerRef.current?.target_x);
  }, [currentPlayer]);

  const loop = (time: number) => {
    const dt = time - previousTime.current;
    previousTime.current = time;

    accumulator.current += dt;

    while (accumulator.current >= timeStep) {
      if (currentPlayerRef.current) {
        previousPlayerPos.current = { ...currentPlayerRef.current }; 
      }
      if (playersRef.current) {
        previousPlayersRef.current = playersRef.current.map(player => ({ ...player }));
      }
      accumulator.current -= timeStep;
    }

    const alpha = accumulator.current / timeStep;

    if (previousPlayerPos.current && currentPlayerRef.current) {
      renderWithInterpolation(previousPlayerPos.current, currentPlayerRef.current, alpha);
    }

    window.requestAnimationFrame(loop);
  };

  const renderWithInterpolation = (prevPos: Blob, currPos: Blob, alpha: number) => {
    if (gameId !== null && currentPlayerRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = screenSize.width * scale;
          canvas.height = screenSize.height * scale;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const interpolatedX = prevPos.x + (currPos.x - prevPos.x) * alpha;
          const interpolatedY = prevPos.y + (currPos.y - prevPos.y) * alpha;

          /* playersRef.current.forEach((blob) => {
            drawPlayer(ctx, 
              {...blob, 
              x: blob.x - interpolatedX + screenSize.width / 2, 
              y: blob.y - interpolatedY + screenSize.height / 2}, scale);
          }); */

          playersRef.current.forEach((blob, index) => {
            const prevBlob = previousPlayersRef.current[index] || blob;
            //const dampingFactor = 0.8;
            const interpolatedBlobX = prevBlob.x + (blob.x - prevBlob.x) * alpha;
            const interpolatedBlobY = prevBlob.y + (blob.y - prevBlob.y) * alpha;
            //const smoothedBlobX = interpolatedBlobX * dampingFactor + blob.x * (1 - dampingFactor);
            //const smoothedBlobY = interpolatedBlobY * dampingFactor + blob.y * (1 - dampingFactor);
  
            const adjustedX =
              interpolatedBlobX - interpolatedX + screenSize.width / 2;
            const adjustedY =
              interpolatedBlobY - interpolatedY + screenSize.height / 2;
            if(currentPlayerRef.current){
              drawPlayer3(ctx, { ...blob, x: adjustedX, y: adjustedY }, { ...currentPlayerRef.current, x: interpolatedX, y: interpolatedY }, scale);
            }
          });
          
          foodRef.current.forEach((food) => {
            drawFood3(ctx, {...food, 
               x: food.x - interpolatedX + screenSize.width / 2,
               y: food.y - interpolatedY + screenSize.height / 2,}, scale);
          });

          const centeredPlayer = {
            ...currentPlayerRef.current,
            x: screenSize.width / 2,
            y: screenSize.height / 2,
          };

          drawPlayer2(ctx, { ...centeredPlayer, x: centeredPlayer.x, y: centeredPlayer.y }, { ...currentPlayerRef.current, x: interpolatedX, y: interpolatedY }, scale);
          drawBorder(ctx, { ...currentPlayerRef.current, x: interpolatedX, y: interpolatedY }, screenSize, scale);
        }
      }
    }
  };
  
  useEffect(() => {
    window.requestAnimationFrame((time) => { 
      previousTime.current = time;
      window.requestAnimationFrame(loop);
    });
  }, [gameId]);

  /*if(currentPlayerPos.current){
      currentPlayerPos.current = updatePlayerPosition(currentPlayerPos.current, currentPlayerPos.current.target_x, currentPlayerPos.current.target_y, timeStep);
  }*/

  const updatePlayerPosition = (
    player: Blob,
    target_x: number,
    target_y: number,
    dt: number 
  ) => {
    const player_x = player.x;
    const player_y = player.y;
    const dx = target_x - player_x;
    const dy = target_y - player_y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const deg = Math.atan2(dy, dx);
  
    let effective_mass = 100.0;
    let true_mass  = player.mass / 10;
    if (true_mass > 100.0) {
      effective_mass = true_mass;
    }
    let slow_down = 1.0;
    if (player.speed <= 6.25) {
      slow_down = Math.log(effective_mass / 10) / 1.504 - 0.531;
    }
    
    let scale_up = 3.0;
    if (true_mass < 100.0) {
      scale_up = -0.01 * true_mass + 4.0;
    }
    const delta_y = (player.speed * scale_up * Math.sin(deg) * (dt / 1000)) / slow_down;
    const delta_x = (player.speed * scale_up * Math.cos(deg) * (dt / 1000)) / slow_down;
  
    player.y = Math.round(player_y + delta_y);
    player.x = Math.round(player_x + delta_x);
  
    player.y = Math.max(0, Math.min(player.y, screenSize.height));
    player.x = Math.max(0, Math.min(player.x, screenSize.width));
  
    return player;
  };
  
  /*useEffect(() => {
    if (gameId !== null) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = screenSize.width * scale;
          canvas.height = screenSize.height * scale;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          players.forEach(blob => {
            drawPlayer(ctx, blob, scale);
          });

          visibleFood.forEach(food => {
            drawFood2(ctx, food, scale);
          });

          if (currentPlayer) {
            const centeredPlayer = {
              ...currentPlayer,
              x: screenSize.width / 2,
              y: screenSize.height / 2,
            };
            drawPlayer(ctx, centeredPlayer, scale);
            drawBorder(ctx, currentPlayer, screenSize, scale);
          }
        }
      }
    }
  }, [gameId, players, visibleFood, currentPlayer, screenSize, scale]);*/

  const drawPlayer3 = (ctx: CanvasRenderingContext2D, blob: Blob, myblob: Blob, scale: number) => {
    let glowSize = 0;
    let glowIntensity = 'rgba(19, 241, 149, 0)'; 

    if(blob.mass > myblob.mass * 1.05){
      glowSize = 50 * scale;
      glowIntensity = 'rgba(240, 113, 113, 0.5)'

    }
    else if(myblob.mass > blob.mass * 1.05){
      glowSize = 50 * scale;
      glowIntensity = 'rgba(19, 241, 149, 0.5)'; 
    }
    else{
      glowSize = 50 * scale;
      glowIntensity = 'rgba(255, 239, 138, 0.5)';
    }

    const diameter = blob.radius * scale * 2;
    // Calculate angle between current position and target position
    const dx = blob.target_x - blob.x; //playerMouseLocation.x; //- blob.x;
    const dy = blob.target_y - blob.y; //playerMouseLocation.y; // - blob.y;
    const angle = Math.atan2(dy, dx); // Returns angle in radians (-π to π)

    // Determine the quadrant based on the angle
    let imageIndex = 0;
    if (angle >= -Math.PI / 8 && angle < Math.PI / 8) {
      imageIndex = 6; // Side-right
    } else if (angle >= Math.PI / 8 && angle < 3 * Math.PI / 8) {
      imageIndex = 4; // Down-right
    } else if (angle >= 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) {
      imageIndex = 1; // Down
    } else if (angle >= 5 * Math.PI / 8 && angle < 7 * Math.PI / 8) {
      imageIndex = 5; // Down-left
    } else if (angle >= 7 * Math.PI / 8 || angle < -7 * Math.PI / 8) {
      imageIndex = 7; // Side-left
    } else if (angle >= -7 * Math.PI / 8 && angle < -5 * Math.PI / 8) {
      imageIndex = 3; // Up-left
    } else if (angle >= -5 * Math.PI / 8 && angle < -3 * Math.PI / 8) {
      imageIndex = 0; // Up
    } else if (angle >= -3 * Math.PI / 8 && angle < -Math.PI / 8) {
      imageIndex = 2; // Up-right
    }
  
    // Select the appropriate image
    const selectedImage = playerImages[imageIndex];
    
    // Render the selected image if it is loaded
    if (selectedImage && selectedImage.complete) {
      ctx.save();
      ctx.shadowBlur = glowSize;
      ctx.shadowColor = glowIntensity;
      ctx.drawImage(
        selectedImage, 
        blob.x * scale - diameter / 2,  
        blob.y * scale - diameter / 2,  
        diameter,                       
        diameter                       
      );
      ctx.restore();
    } else {
      // Fallback: draw a simple circle if the image isn't loaded
      ctx.beginPath();
      ctx.arc(blob.x * scale, blob.y * scale, blob.radius * scale, 0, 2 * Math.PI);
      ctx.fillStyle = '#13F195';
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawPlayer2 = (ctx: CanvasRenderingContext2D, blob: Blob, currentblob: Blob, scale: number) => {
    const diameter = blob.radius * scale * 2;
    // Calculate angle between current position and target position
    const dx = currentblob.target_x - currentblob.x; //playerMouseLocation.x; //- blob.x;
    const dy = currentblob.target_y - currentblob.y; //playerMouseLocation.y; // - blob.y;
    const angle = Math.atan2(dy, dx); // Returns angle in radians (-π to π)

    // Determine the quadrant based on the angle
    let imageIndex = 0;
    if (angle >= -Math.PI / 8 && angle < Math.PI / 8) {
      imageIndex = 6; // Side-right
    } else if (angle >= Math.PI / 8 && angle < 3 * Math.PI / 8) {
      imageIndex = 4; // Down-right
    } else if (angle >= 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) {
      imageIndex = 1; // Down
    } else if (angle >= 5 * Math.PI / 8 && angle < 7 * Math.PI / 8) {
      imageIndex = 5; // Down-left
    } else if (angle >= 7 * Math.PI / 8 || angle < -7 * Math.PI / 8) {
      imageIndex = 7; // Side-left
    } else if (angle >= -7 * Math.PI / 8 && angle < -5 * Math.PI / 8) {
      imageIndex = 3; // Up-left
    } else if (angle >= -5 * Math.PI / 8 && angle < -3 * Math.PI / 8) {
      imageIndex = 0; // Up
    } else if (angle >= -3 * Math.PI / 8 && angle < -Math.PI / 8) {
      imageIndex = 2; // Up-right
    }
  
    // Select the appropriate image
    const selectedImage = playerImages[imageIndex];
  
    // Render the selected image if it is loaded
    if (selectedImage && selectedImage.complete) {
      ctx.drawImage(
        selectedImage, 
        blob.x * scale - diameter / 2,  
        blob.y * scale - diameter / 2,  
        diameter,                       
        diameter                       
      );
    } else {
      // Fallback: draw a simple circle if the image isn't loaded
      ctx.beginPath();
      ctx.arc(blob.x * scale, blob.y * scale, blob.radius * scale, 0, 2 * Math.PI);
      ctx.fillStyle = '#13F195';
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, blob: Blob, scale: number) => {
    let glowSize = 0;
    let glowIntensity = 'rgba(19, 241, 149, 0)'; 

    ctx.shadowBlur = glowSize;
    ctx.shadowColor = glowIntensity;

    ctx.beginPath();
    ctx.arc(blob.x * scale, blob.y * scale, blob.radius * scale, 0, 2 * Math.PI);
    ctx.fillStyle = '#13F195'; 
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'rgba(0, 0, 0, 0)';

    ctx.fillStyle = 'black'; 
    ctx.font = `${blob.radius * scale * 0.3}px Arial`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(blob.name, blob.x * scale, blob.y * scale);
  };

  const drawFood = (ctx: CanvasRenderingContext2D, food: Food, scale: number) => {
    ctx.beginPath();
    ctx.arc(food.x * scale, food.y * scale, 10 * scale, 0, 2 * Math.PI);
    ctx.fillStyle = 'white'; 
    ctx.fill();
    ctx.stroke();
  };

  const drawFood3 = (ctx: CanvasRenderingContext2D, food: Food, scale: number) => {
    const diameter = 20 * scale; // Adjust size dynamically
    const sizeIndex = food.size - 1; // Adjust size to match zero-based index
    const selectedImage = foodImages[sizeIndex]; // Get the image corresponding to food size
  
    if (selectedImage && selectedImage.complete) {
      // Draw the selected food image
      ctx.drawImage(
        selectedImage, 
        food.x * scale - diameter / 2,  
        food.y * scale - diameter / 2,  
        diameter,                       
        diameter                       
      );
    } else {
      // Fallback: draw a white circle if the image isn't loaded
      ctx.beginPath();
      ctx.arc(food.x * scale, food.y * scale, diameter / 2, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawFood2 = (ctx: CanvasRenderingContext2D, food: Food, scale: number) => {
    const diameter = 20 * scale; 
    if (foodImage.complete) {
      ctx.drawImage(
        foodImage, 
        food.x * scale - diameter / 2,  
        food.y * scale - diameter / 2,  
        diameter,                       
        diameter                       
      );
    } else {
      ctx.beginPath();
      ctx.arc(food.x * scale, food.y * scale, 10, 0, 2 * Math.PI); 
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawBorder = (ctx: CanvasRenderingContext2D, currentPlayer: Blob, screenSize: { width: number; height: number }, scale: number) => {
    const gameSize = screenSize.width;
    const offsetX = currentPlayer.x - screenSize.width / 2;
    const offsetY = currentPlayer.y - screenSize.height / 2;

    ctx.beginPath();
    ctx.moveTo((0 - offsetX) * scale, (0 - offsetY) * scale);
    ctx.lineTo((gameSize - offsetX) * scale, (0 - offsetY) * scale);
    ctx.strokeStyle = 'red';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((gameSize - offsetX) * scale, (0 - offsetY) * scale);
    ctx.lineTo((gameSize - offsetX) * scale, (gameSize - offsetY) * scale);
    ctx.strokeStyle = 'red';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((gameSize - offsetX) * scale, (gameSize - offsetY) * scale);
    ctx.lineTo((0 - offsetX) * scale, (gameSize - offsetY) * scale);
    ctx.strokeStyle = 'red';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((0 - offsetX) * scale, (gameSize - offsetY) * scale);
    ctx.lineTo((0 - offsetX) * scale, (0 - offsetY) * scale);
    ctx.strokeStyle = 'red';
    ctx.stroke();
};

  return (
      <canvas id="gamecanvas" ref={canvasRef} style={{ position: "relative", width: "100%", height: "100%",display: gameId !== null ? 'block' : 'none' }}></canvas>
  );
};

export default GameComponent;
