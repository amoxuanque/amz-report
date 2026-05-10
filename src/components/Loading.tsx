import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Target, Search, BarChart, FileText } from 'lucide-react';

interface LoadingProps {
  mode: 'find' | 'compare' | 'source';
  onComplete: () => void;
}

export default function Loading({ mode, onComplete }: LoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = {
    find: [
      { text: "解析基准 ASIN 特征...", icon: Target },
      { text: "扫描 Amazon 细分类目池...", icon: Search },
      { text: "清洗非对抗性样本...", icon: BarChart },
      { text: "生成竞品候选网络...", icon: FileText }
    ],
    compare: [
      { text: "正在抓取 Sorftime 商品全貌...", icon: Target },
      { text: "比对流量词分布结构...", icon: Search },
      { text: "抽取评价痛点与正面特征...", icon: BarChart },
      { text: "合成跨维度商业分析报告...", icon: FileText }
    ],
    source: [
      { text: "降维 Amazon 特征为寻源词...", icon: Target },
      { text: "匹配 1688 同款与平替供给...", icon: Search },
      { text: "排查工厂资质与履约信号...", icon: BarChart },
      { text: "生成供应链决策建议...", icon: FileText }
    ]
  };

  const currentSteps = steps[mode];

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < currentSteps.length) {
        setCurrentStep(step);
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 500); // 驻留一下视觉
      }
    }, 800); // 每个步骤 800ms
    return () => clearInterval(interval);
  }, [mode, currentSteps.length, onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-12 flex justify-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1], 
              rotateCurve: [0, 180, 360],
              filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(0deg)']
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
          >
            <div className="w-8 h-8 rounded-full border-2 border-white/50 border-t-white animate-spin" />
          </motion.div>
        </div>
        
        <div className="space-y-4">
          {currentSteps.map((step, index) => {
            const Icon = step.icon;
            const isPast = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: isPast ? 0.4 : isCurrent ? 1 : 0,
                  x: isPast || isCurrent ? 0 : -10 
                }}
                className={`flex items-center gap-4 ${isCurrent ? 'scale-105' : ''} transition-all duration-300 font-medium`}
              >
                <div className={`p-2 rounded-full ${isCurrent ? 'bg-blue-100 text-blue-600' : isPast ? 'bg-slate-100 text-slate-400' : 'text-transparent'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={isCurrent ? 'text-slate-900 font-semibold text-lg' : 'text-slate-500'}>
                  {step.text}
                </span>
                {isCurrent && (
                  <motion.span 
                    animate={{ opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-1 h-5 bg-blue-500 rounded-full inline-block ml-1"
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
