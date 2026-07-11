import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export default function ErrorBanner({ errors = [], variant = 'card' }) {
    if (errors.length === 0) {
        return null;
    }

    const isVideo = variant === 'video';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: isVideo ? 8 : -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: isVideo ? 8 : -8 }}
                className={isVideo
                    ? 'absolute top-20 left-4 right-4 p-3 rounded-xl text-sm z-30 flex items-start gap-2'
                    : 'm-4 p-3 rounded-xl text-sm flex items-start gap-2'}
                style={isVideo
                    ? { backgroundColor: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(8px)', color: 'white' }
                    : { backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                    {errors.map((error, index) => (
                        <p key={index}>{error}</p>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
