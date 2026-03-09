import Layout from "@/components/Layout";
import { Bell, Plus, Trash2, Mail, Smartphone, CheckCheck, Circle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlerts, Alert, AlertFilters } from "@/hooks/useAlerts";
import { useNotifications } from "@/hooks/useNotifications";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import AlertFormDialog from "@/components/AlertFormDialog";

const NOTIFICATION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  new_match: { label: "Nueva", color: "bg-primary/15 text-primary" },
  price_change: { label: "Precio", color: "bg-amber-500/15 text-amber-600" },
  removed: { label: "Bajada", color: "bg-destructive/15 text-destructive" },
};

const Alertas = () => {
  const { alerts, isLoading: alertsLoading, canCreateMore, createAlert, updateAlert, deleteAlert } = useAlerts();
  const { notifications, unreadCount, isLoading: notifsLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { limits, plan } = useSubscription();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const handleCreateAlert = async (data: Omit<Alert, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      await createAlert.mutateAsync(data);
      toast({ title: "Alerta creada", description: "Vas a recibir notificaciones cuando aparezcan nuevas propiedades." });
      setDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "No se pudo crear la alerta.", variant: "destructive" });
    }
  };

  const handleUpdateAlert = async (data: Partial<Alert> & { id: string }) => {
    try {
      await updateAlert.mutateAsync(data);
      toast({ title: "Alerta actualizada" });
      setEditingAlert(null);
      setDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar la alerta.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (alert: Alert) => {
    await updateAlert.mutateAsync({ id: alert.id, active: !alert.active });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert.mutateAsync(id);
      toast({ title: "Alerta eliminada" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="container px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-0.5">Alertas</h2>
            <p className="text-sm text-muted-foreground">
              Configurá alertas y revisá tus notificaciones.
            </p>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-primary/20 text-primary">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Bell className="h-4 w-4" />
              Mis alertas
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                {alerts.length}/{limits.alerts === Infinity ? "∞" : limits.alerts}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Notifications tab */}
          <TabsContent value="notifications" className="space-y-3">
            {unreadCount > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs gap-1.5"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas como leídas
                </Button>
              </div>
            )}

            {notifsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Sin notificaciones</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Cuando tus alertas detecten nuevas propiedades o cambios en tus proyectos guardados, van a aparecer acá.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => {
                  const typeInfo = NOTIFICATION_TYPE_LABELS[n.type] || { label: n.type, color: "bg-muted text-muted-foreground" };
                  return (
                    <Card
                      key={n.id}
                      className={`transition-all ${!n.read ? "border-primary/30 bg-primary/[0.02]" : "opacity-75"}`}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="mt-1">
                          {!n.read ? (
                            <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                          ) : (
                            <Circle className="h-2.5 w-2.5 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                        </div>
                        <div className="flex gap-1">
                          {!n.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => markAsRead.mutate([n.id])}
                              title="Marcar como leída"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/60 hover:text-destructive"
                            onClick={() => deleteNotification.mutate(n.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Alert config tab */}
          <TabsContent value="config" className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => { setEditingAlert(null); setDialogOpen(true); }}
                disabled={!canCreateMore}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Nueva alerta
              </Button>
            </div>

            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Sin alertas configuradas</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Creá tu primera alerta para recibir notificaciones cuando aparezcan propiedades que te interesen.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onToggle={() => handleToggleActive(alert)}
                    onEdit={() => { setEditingAlert(alert); setDialogOpen(true); }}
                    onDelete={() => handleDelete(alert.id)}
                  />
                ))}
              </div>
            )}

            {!canCreateMore && (
              <p className="text-xs text-muted-foreground text-center">
                Alcanzaste el límite de {limits.alerts} alerta{limits.alerts !== 1 ? "s" : ""} del plan {plan}.{" "}
                <a href="/planes" className="text-primary hover:underline">Mejorá tu plan</a> para crear más.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        alert={editingAlert}
        onSubmit={editingAlert
          ? (data) => handleUpdateAlert({ ...data, id: editingAlert.id })
          : handleCreateAlert}
      />
    </Layout>
  );
};

function AlertCard({ alert, onToggle, onEdit, onDelete }: {
  alert: Alert;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const filters = alert.filters as AlertFilters;
  const FREQ_LABELS: Record<string, string> = { immediate: "Inmediato", daily: "Diario", weekly: "Semanal" };

  return (
    <Card className={`transition-all ${!alert.active ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-sm">{alert.name}</h4>
              {!alert.active && (
                <Badge variant="secondary" className="text-[10px]">Pausada</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {filters.zones && filters.zones.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {filters.zones.length} zona{filters.zones.length !== 1 ? "s" : ""}
                </Badge>
              )}
              {filters.property_types && filters.property_types.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {filters.property_types.join(", ")}
                </Badge>
              )}
              {(filters.price_min || filters.price_max) && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {filters.price_currency || "USD"} {filters.price_min?.toLocaleString() || "0"} - {filters.price_max?.toLocaleString() || "∞"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {alert.email_enabled && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {FREQ_LABELS[alert.email_frequency] || alert.email_frequency}
                </span>
              )}
              {alert.in_app_enabled && (
                <span className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" /> In-app
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={alert.active} onCheckedChange={onToggle} />
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs h-8">
              Editar
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Alertas;
