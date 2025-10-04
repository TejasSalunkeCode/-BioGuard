import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Pill, 
  Activity, 
  Brain, 
  Dumbbell, 
  Ambulance, 
  DollarSign,
  ArrowRight,
  Shield,
  BookOpen
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const Dashboard = () => {
  const { t } = useLanguage();

  const modules = [
    {
      id: "healthjournal",
      title: t('modules.healthJournal.title'),
      description: t('modules.healthJournal.description'),
      icon: BookOpen,
      path: "/health-journal",
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      id: "medguard",
      title: t('modules.medGuard.title'),
      description: t('modules.medGuard.description'),
      icon: Pill,
      path: "https://bioguard-2.netlify.app/",
      external: true,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      id: "predictguard",
      title: t('modules.predictGuard.title'),
      description: t('modules.predictGuard.description'),
      icon: Activity,
      path: "/chatbot?module=predictguard",
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      id: "mindguard",
      title: t('modules.mindGuard.title'),
      description: t('modules.mindGuard.description'),
      icon: Brain,
      path: "/chatbot?module=mindguard",
      gradient: "from-teal-500 to-emerald-500",
      bgColor: "bg-teal-50 dark:bg-teal-950/20"
    },
    {
      id: "fitguard",
      title: t('modules.fitGuard.title'),
      description: t('modules.fitGuard.description'),
      icon: Dumbbell,
      path: "/chatbot?module=fitguard",
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      id: "rescueguard",
      title: t('modules.rescueGuard.title'),
      description: t('modules.rescueGuard.description'),
      icon: Ambulance,
      path: "/chatbot?module=rescueguard",
      gradient: "from-red-500 to-rose-500",
      bgColor: "bg-red-50 dark:bg-red-950/20"
    },
    {
      id: "fundguard",
      title: t('modules.fundGuard.title'),
      description: t('modules.fundGuard.description'),
      icon: DollarSign,
      path: "/chatbot?module=fundguard",
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              <span>{t('hero.badge')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{t('modules.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {modules.map((module, index) => {
              const Icon = module.icon;
              const CardContent = (
                <Card className="group relative overflow-hidden h-full hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className="p-6 relative z-10">
                    {/* Icon */}
                    <div className={`${module.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-7 w-7 text-primary`} />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {module.description}
                    </p>
                    
                    {/* Arrow */}
                    <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 gap-1 transition-all">
                      <span>{t('modules.healthJournal.explore')}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              );

              return module.external ? (
                <a
                  key={module.id}
                  href={module.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-scale-in"
                >
                  {CardContent}
                </a>
              ) : (
                <Link 
                  key={module.id} 
                  to={module.path}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-scale-in"
                >
                  {CardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-12 mb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
            <div className="p-8 text-center space-y-4">
              <Shield className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-2xl font-bold">{t('trust.title')}</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('trust.description')}
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
