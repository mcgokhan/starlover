import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


 * Format seconds into MM:SS format
    * @param seconds - Number of seconds to format
        * @returns Formatted time string(e.g. "2:05")

export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}


 * Get call state description based on state and duration
    * @param state - Current call state
        * @param duration - Call duration in seconds(for active calls)
 * @returns Human - readable status text

export function getCallStateDescription(
    state: 'idle' | 'incoming' | 'connecting' | 'active' | 'ended',
    duration: number = 0
): string {
    switch (state) {
        case 'idle':
            return 'Ready to call';
        case 'incoming':
            return 'Incoming call...';
        case 'connecting':
            return 'Connecting...';
        case 'active':
            return formatDuration(duration);
        case 'ended':
            return 'Call ended';
        default:
            return '';
    }
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
