import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../hooks/useAuth';
import { getGreeting, getGreetingSubtitle } from '../../utils/greeting';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { StatCard } from '../../components/ui/StatCard/StatCard';
import { DashboardSkeleton } from '../../components/ui/Skeleton/Skeleton';
import { ErrorState } from '../../components/ui/FeedbackStates/FeedbackStates';
import { Card, CardHeader, CardBody } from '../../components/ui/Card/Card';
import { DollarSign, TrendingUp, TrendingDown, Sprout, Calendar, Bell } from 'lucide-react';
import styles from './Dashboard.module.scss';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboard(user?.id);

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{getGreeting(user?.name)}</h1>
          <p className={styles.subtitle}>{getGreetingSubtitle()}</p>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <StatCard
          label="Resultado acumulado"
          value={formatCurrency(data.financial.result)}
          icon={<DollarSign />}
          color={data.financial.result >= 0 ? 'green' : 'red'}
          change={{ value: formatPercentage(data.financial.profitMargin), positive: data.financial.result >= 0 }}
        />
        <StatCard
          label="Receitas"
          value={formatCurrency(data.financial.revenue)}
          icon={<TrendingUp />}
          color="blue"
        />
        <StatCard
          label="Despesas"
          value={formatCurrency(data.financial.expenses)}
          icon={<TrendingDown />}
          color="orange"
        />
        <StatCard
          label="Produções Ativas"
          value={String(data.productionsCount)}
          icon={<Sprout />}
          color="purple"
        />
      </section>

      <div className={styles.mainGrid}>
        <Card className={styles.chartCard}>
          <CardHeader title="Visão Financeira" />
          <CardBody>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.financialChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} />
                  <Tooltip formatter={(val) => formatCurrency(Number(val ?? 0))} />
                  <Legend />
                  <Bar dataKey="revenue" name="Receitas" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Despesas" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <div className={styles.sideGrid}>
          <Card>
            <CardHeader title="Alertas" action={<Bell size={18} className={styles.iconMuted} />} />
            <CardBody className={styles.listBody}>
              {data.alerts.map(alert => (
                <div key={alert.id} className={`${styles.listItem} ${styles[`listItem--${alert.priority}`]}`}>
                  <div className={styles.listItem__content}>
                    <h4>{alert.title}</h4>
                    <p>{alert.message}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Próximas Atividades" action={<Calendar size={18} className={styles.iconMuted} />} />
            <CardBody className={styles.listBody}>
              {data.upcomingActivities.slice(0, 4).map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityItem__date}>
                    <span>{new Date(`${activity.date}T12:00:00`).getDate()}</span>
                    <small>{new Date(`${activity.date}T12:00:00`).toLocaleString('pt-BR', { month: 'short' })}</small>
                  </div>
                  <div className={styles.activityItem__info}>
                    <h4>{activity.title}</h4>
                    <span className={styles.tag}>{activity.category}</span>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
