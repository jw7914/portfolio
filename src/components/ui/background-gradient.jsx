import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "motion/react";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
  glowClassName,
  gradientClassName,
  ...props
}) => {
  const MotionDiv = motion.div;
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <div
      {...props}
      className={cn("group relative inline-block rounded-lg p-px", containerClassName)}
    >
      <MotionDiv
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
        }}
        className={cn(
          "absolute inset-0 z-[1] rounded-[inherit] opacity-45 blur-sm transition duration-500 will-change-transform group-hover:opacity-80",
          "bg-[linear-gradient(90deg,#00ccb1,#7b61ff,#ffc414,#1ca0fb,#00ccb1)]",
          glowClassName,
        )}
      />
      <MotionDiv
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
        }}
        className={cn(
          "absolute inset-0 z-[1] rounded-[inherit] will-change-transform",
          "bg-[linear-gradient(90deg,#00ccb1,#7b61ff,#ffc414,#1ca0fb,#00ccb1)]",
          gradientClassName,
        )}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};
