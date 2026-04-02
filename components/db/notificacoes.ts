import * as Notifications from 'expo-notifications';

export const agendarNotificacoesHabito = async (nome: string, hora: string, descricao: string, tipo: 'iniciar' | 'finalizar') => {
  const [hh, mm] = hora.split(':').map(Number);
  
  const title = tipo === 'iniciar' ? `Hora de começar: ${nome}` : `Hora de finalizar: ${nome}`;
  const body = tipo === 'iniciar' ? `Descrição: ${descricao}` : `Bom trabalho! Atividade concluída.`;

  return await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hh,
      minute: mm,
    },
  });
};

export const apagarNotificacao = async (id: string) => {
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
};
