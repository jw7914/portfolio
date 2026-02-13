"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "motion/react";

export const ContainerScroll = ({ titleComponent, children }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [1, 1] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-auto flex items-center justify-center relative p-0 m-0"
      ref={containerRef}
    >
      <div
        className="p-0 m-0 w-full relative"
        style={{
          perspective: "1200px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({ rotate, scale, children }) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="w-[90vw] sm:w-[85vw] md:w-[80vw] max-w-md sm:max-w-4xl md:max-w-5xl lg:max-w-[70vw] -mt-8 sm:-mt-16 mx-auto h-[40rem] sm:h-[45rem] md:h-[50rem] border-4 border-[#6C6C6C] p-2 sm:p-4 md:p-12 bg-[#222222] rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-2xl p-2 sm:p-4 md:p-8 bg-gray-100 bg-zinc-900">
        {children}
      </div>
    </motion.div>
  );
};
