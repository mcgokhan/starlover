import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CallButtonProps {
    icon: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant: 'red' | 'green' | 'blue' | 'purple' | 'default';
    size?: 'normal' | 'large' | 'small';
    isActive?: boolean;
    className?: string;
    iconClassName?: string;
}

export function CallButton({
    icon,
    onClick,
    disabled = false,
    variant = 'default',
    size = 'normal',
    isActive = false,
    className,
    iconClassName,
}: CallButtonProps) {
    const [isClicked, setIsClicked] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 200);

        return () => clearTimeout(timer);
    }, []);


    const buttonSizeClasses = {
        small: "h-11 w-11",
        normal: "w-16 h-16 md:w-20 md:h-20",
        large: "h-20 w-20 md:h-24 md:w-24",
    };


    const buttonVariantClasses = {
        red: "bg-red-500/80 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/30",
        green: "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/30",
        blue: isActive
            ? "bg-blue-500 shadow-xl shadow-blue-500/30"
            : "bg-white/10 hover:bg-white/20 shadow-lg",
        purple: isActive
            ? "bg-purple-500 shadow-xl shadow-purple-500/30"
            : "bg-purple-400/60 hover:bg-purple-400/80 shadow-lg",
        default: "bg-white/10 hover:bg-white/20 text-white shadow-lg",
    };

    const handleClick = () => {
        if (disabled || !onClick) return;


        setIsClicked(true);


        onClick();

        setTimeout(() => {
            setIsClicked(false);
        }, 300);
    };

    const getRippleColor = () => {
        switch (variant) {
            case 'red': return 'rgba(239, 68, 68, 0.4)'; // red-500
            case 'green': return 'rgba(34, 197, 94, 0.4)'; // green-500
            case 'blue': return isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.2)'; // blue-500 or white
            case 'purple': return isActive ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.2)'; // purple-500 or white
            default: return 'rgba(255, 255, 255, 0.2)'; // white
        }
    };


    const getGlowColor = () => {
        if (disabled) return 'transparent';

        switch (variant) {
            case 'red': return 'rgba(239, 68, 68, 0.3)'; // red-500
            case 'green': return 'rgba(34, 197, 94, 0.3)'; // green-500
            case 'blue': return isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            case 'purple': return isActive ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                scale: 1
            }}
            transition={{
                opacity: { duration: 0.2 },
                scale: { duration: 0.3, delay: 0.1 }
            }}

            whileHover={isLoaded ? {
                scale: disabled ? 1 : 1.1,
                y: disabled ? 0 : -4,
                transition: { type: "spring", stiffness: 200, damping: 15 }
            } : {}}
            whileTap={isLoaded ? {
                scale: disabled ? 1 : 0.95,
                transition: { type: "spring", stiffness: 300, damping: 10 }
            } : {}}
            onHoverStart={() => !disabled && setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <div
                className={cn(
                    buttonSizeClasses[size],
                    buttonVariantClasses[variant],
                    "flex items-center justify-center rounded-full cursor-pointer transition-all relative overflow-hidden",
                    disabled ? "opacity-50 cursor-not-allowed" : "",
                    className
                )}
                onClick={handleClick}
                style={{
                    boxShadow: isHovered && !disabled && isLoaded ? `0 0 15px ${getGlowColor()}` : undefined
                }}
            >
                <motion.div
                    className={cn("relative z-10", iconClassName)}
                    animate={{
                        scale: isClicked ? 0.9 : 1,
                        rotate: isClicked ? 5 : 0
                    }}
                    transition={{
                        duration: 0.3,
                        type: isClicked ? "spring" : "tween",
                        stiffness: 500
                    }}
                >
                    {icon}
                </motion.div>


                <AnimatePresence>
                    {isClicked && !disabled && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0.8 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                borderRadius: '100%',
                                backgroundColor: getRippleColor(),
                                zIndex: 0
                            }}
                        />
                    )}
                </AnimatePresence>

                {isActive && !disabled && (variant === 'blue' || variant === 'purple') && isLoaded && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                            boxShadow: variant === 'purple'
                                ? '0 0 0 8px rgba(168, 85, 247, 0)'
                                : '0 0 0 10px rgba(59, 130, 246, 0)'
                        }}
                        initial={{
                            boxShadow: variant === 'purple'
                                ? '0 0 0 0px rgba(168, 85, 247, 0.3)'
                                : '0 0 0 0px rgba(59, 130, 246, 0.3)'
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                    />
                )}


                <AnimatePresence>
                    {isClicked && !disabled && (
                        <motion.div
                            className="absolute inset-0 rounded-full bg-black/10 z-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
} 