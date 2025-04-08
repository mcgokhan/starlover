import { ReactNode } from 'react';
import { cn } from '../utils';
import { motion } from 'framer-motion';

export interface AvatarFrameProps {
    children: ReactNode;
    isActive: boolean;
    className?: string;
    containerClassName?: string;
    
     
     * @default true
    */
enablePulseScale ?: boolean;
    
     
     * @default true
    */
enablePulse ?: boolean;
}

export function AvatarFrame({
    children,
    isActive,
    className,
    containerClassName,
    enablePulseScale = true,
    enablePulse = true
}: AvatarFrameProps) {

    const inActiveContainer = (
        <motion.div
            className={cn(
                "rounded-full overflow-hidden border-4 border-white/20",
                className
            )}
            animate={{
                scale: [1, 1.02, 1, 1.01, 1],
                rotate: [0, -5, 5, -5, 0]
            }}
            transition={{
                duration: 1.2,
                repeatDelay: 1,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {children}
        </motion.div>
    );
    const activeContainer = (
        <motion.div
            className={cn(
                "rounded-full overflow-hidden border-4 border-white/20",
                className
            )}
            animate={{
                scale: [1, 1.02, 1, 1.01, 1]
            }}
            transition={{
                duration: 1.2,
                repeatDelay: 1,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {children}
        </motion.div>
    );

    return (
        <div className={cn("relative", containerClassName)}>
            {isActive ? activeContainer : inActiveContainer}
            <div className="absolute -inset-2 border-4 border-white/20 rounded-full animate-[ping_3s_ease-in-out_infinite] [animation-delay:1s]" />
        </div>
    );

} 