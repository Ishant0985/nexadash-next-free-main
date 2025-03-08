// components/LottiePlayer.tsx
"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export const LottiePlayer = () => {
  return (
    <div className="w-64 h-64">
      <DotLottieReact
        src="/animation/loading.lottie" // Local file inside public folder
        autoplay
        loop
      />
    </div>
  );
};

export const LottiePlayer2 = () => {
  return (
    <div className="w-64 h-64">
      <DotLottieReact
        src="https://lottie.host/8ed41fbe-1cac-4ec1-8da2-b4394212c821/H5qPMkYZrJ.lottie"
        loop
        autoplay
      />
    </div>
  );
};
