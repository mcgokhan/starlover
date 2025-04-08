import { ReactNode, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CallDialButtonProps {
    icon: ReactNode;
    onClick: () => void;
    variant: 'accept' | 'decline';
    pulseEffect?: boolean;
    className?: string;
    iconClassName?: string;
    enableRipple?: boolean;
}

export function CallDialButton({
    icon,
    onClick,
    variant = 'accept',
    pulseEffect = true,
    className,
    iconClassName,
    enableRipple = true
}: CallDialButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [showPulseEffect, setShowPulseEffect] = useState(false);
    const [showRipple, setShowRipple] = useState(false);


    const colors = {
        accept: {
            bg: "bg-green-500",
            hover: "hover:bg-green-600",
            shadow: "shadow-green-500/30",
            pulse: "rgba(34, 197, 94, 0.5)", // green-500
            ripple: "rgba(255, 255, 255, 0.2)"
        },
        decline: {
            bg: "bg-red-500",
            hover: "hover:bg-red-600",
            shadow: "shadow-red-500/30",
            pulse: "rgba(239, 68, 68, 0.5)", // red-500
            ripple: "rgba(255, 255, 255, 0.2)"
        }
    };

    useEffect(() => {
        if (pulseEffect) {
            const timer = setTimeout(() => {
                setShowPulseEffect(true);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [pulseEffect]);

    useEffect(() => {
        if (enableRipple) {
            const timer = setTimeout(() => {
                setShowRipple(true);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [enableRipple]);


    const handleClick = (e: React.MouseEvent) => {

        if (buttonRef.current && showRipple) {
            const rect = buttonRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            setPosition({ x, y });
            setIsAnimating(true);
        }


        onClick();
    };

    const pulseAnimations = [];
    if (showPulseEffect && pulseEffect) {
        for (let i = 0; i < 2; i++) {
            const baseOpacity = 0.7 - (i * 0.2);
            pulseAnimations.push(
                <motion.div
                    key={`pulse-${i}`}
                    className="absolute inset-0 rounded-full"
                    style={{
                        borderWidth: 2,
                        borderStyle: 'solid',
                        borderColor: colors[variant].pulse,
                        opacity: baseOpacity
                    }}
                    initial={{
                        scale: 1,
                        opacity: baseOpacity
                    }}
                    animate={{
                        scale: 1.7,
                        opacity: 0
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeOut",

                        repeatType: "loop"
                    }}
                />
            );
        }
    }

    const renderRippleEffect = showRipple && enableRipple && (
        <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            initial={{ boxShadow: '0 0 0 0px rgba(255, 255, 255, 0)' }}
            animate={{
                boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.1)'
            }}
            transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
            }}
        />
    );

    return (
        <motion.div
            className="relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0,
            }}
        >
            <div
                ref={buttonRef}
                className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center relative overflow-hidden",
                    "shadow-lg hover:shadow-xl transition-all cursor-pointer",
                    colors[variant].bg,
                    colors[variant].hover,
                    colors[variant].shadow,
                    className
                )}
                onClick={handleClick}
            >
                {pulseAnimations}

                {renderRippleEffect}


                {isAnimating && showRipple && (
                    <motion.div
                        className="absolute bg-white/30 rounded-full"
                        initial={{
                            width: 0,
                            height: 0,
                            x: position.x,
                            y: position.y,
                            opacity: 0.6
                        }}
                        animate={{
                            width: 300,
                            height: 300,
                            x: position.x - 150,
                            y: position.y - 150,
                            opacity: 0
                        }}
                        transition={{ duration: 0.5 }}
                        onAnimationComplete={() => setIsAnimating(false)}
                    />
                )}


                <motion.div
                    className={cn("relative z-10 text-white", iconClassName)}
                    whileHover={{ scale: 1.1, rotate: variant === 'accept' ? 15 : -15 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {icon}
                </motion.div>
            </div>
        </motion.div>
    );
} 