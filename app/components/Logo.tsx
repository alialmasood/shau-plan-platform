"use client";

import Image from "next/image";
import { useState } from "react";

interface LogoProps {
  size?: "small" | "medium" | "large";
}

export default function Logo({ size = "medium" }: LogoProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    small: {
      container: "w-16 h-16 md:w-20 md:h-20",
      text: "text-blue-600 font-bold text-xs",
      border: "border-2",
      imageWidth: 80,
      imageHeight: 80,
    },
    medium: {
      container: "w-32 h-32 md:w-40 md:h-40",
      text: "text-blue-600 font-bold text-lg",
      border: "border-4",
      imageWidth: 160,
      imageHeight: 160,
    },
    large: {
      container: "w-48 h-48 md:w-56 md:h-56",
      text: "text-blue-600 font-bold text-xl",
      border: "border-4",
      imageWidth: 224,
      imageHeight: 224,
    },
  };

  const currentSize = sizeClasses[size];

  if (hasError) {
    return (
      <div className={`${currentSize.container} bg-blue-100 rounded-full flex items-center justify-center ${currentSize.border} border-blue-600`}>
        <span className={currentSize.text}>ش.ع.ت</span>
      </div>
    );
  }

  return (
    <div className={`relative ${currentSize.container} flex items-center justify-center`}>
      <Image
        src="/logo-light.png"
        alt="شعار كلية الشرق للعلوم التنقنية التخصصية"
        width={currentSize.imageWidth}
        height={currentSize.imageHeight}
        priority
        className="object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
