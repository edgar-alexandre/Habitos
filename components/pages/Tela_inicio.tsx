import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, TextInput, Alert } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons'; 

import { getUsers, initDB, deleteUser, addUser, updateUser } from "../db/database";
import { agendarNotificacoesHabito, apagarNotificacao } from "../db/notificacoes";
import { Habitos } from "../db/types";

export function Tela_inicio() {
  const [habitos, setHabitos] = useState<Habitos[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('09:00');
  const [showPicker, setShowPicker] = useState<{show: boolean, type: 'inicio' | 'fim'}>({show: false, type: 'inicio'});

  const carregarHabitos = async () => {
    const lista = await getUsers();
    setHabitos(lista);
  };

  useFocusEffect(useCallback(() => {
    initDB().then(carregarHabitos);
  }, []));

  const abrirModal = (habito?: Habitos) => {
    if (habito) {
      setEditId(habito.id!);
      setNome(habito.nome);
      setDescricao(habito.descricao);
      setHoraInicio(habito.horaInicio);
      setHoraFim(habito.horaFim);
    } else {
      setEditId(null);
      setNome('');
      setDescricao('');
      setHoraInicio('08:00');
      setHoraFim('09:00');
    }
    setModalVisible(true);
  };

  const salvarHabito = async () => {
    if (!nome || !descricao) return Alert.alert("Erro", "Preencha todos os campos");

    const conflito = habitos.find(h => h.horaInicio === horaInicio && h.id !== editId);
    if (conflito) return Alert.alert("Horário Ocupado", "Você já tem uma atividade iniciando neste horário.");

    const idNotifInic = await agendarNotificacoesHabito(nome, horaInicio, descricao, 'iniciar');
    const idNotifFim = await agendarNotificacoesHabito(nome, horaFim, descricao, 'finalizar');

    if (editId) {
      const antigo = habitos.find(h => h.id === editId);
      await apagarNotificacao(antigo?.notificationIdInicio!);
      await apagarNotificacao(antigo?.notificationIdFim!);
      await updateUser(editId, nome, horaInicio, horaFim, descricao, idNotifInic, idNotifFim);
    } else {
      await addUser(nome, horaInicio, horaFim, descricao, idNotifInic, idNotifFim);
    }

    setModalVisible(false);
    carregarHabitos();
  };

  const removerHabito = async (item: Habitos) => {
    Alert.alert("Apagar", "Deseja excluir este hábito?", [
      { text: "Cancelar" },
      { text: "Sim", onPress: async () => {
        await apagarNotificacao(item.notificationIdInicio);
        await apagarNotificacao(item.notificationIdFim);
        await deleteUser(item.id!);
        carregarHabitos();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Minha Rotina</Text>

      {habitos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={80} color="#0091FF" opacity={0.5} />
          <Text style={styles.emptyText}>Sua lista está vazia.</Text>
          <Text style={styles.emptySubText}>Que tal começar um novo hábito hoje?</Text>
        </View>
      ) : (
        <FlatList
          data={habitos}
          keyExtractor={(item) => item.id!.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.clayCard}>
              <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>{item.nome}</Text>
                <Text style={styles.cardTime}>{item.horaInicio} - {item.horaFim}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => abrirModal(item)} style={styles.iconButton}>
                  <Ionicons name="pencil" size={20} color="#0091FF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removerHabito(item)} style={styles.iconButton}>
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => abrirModal()}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalClay}>
            <Text style={styles.modalTitle}>{editId ? 'Editar Hábito' : 'Novo Hábito'}</Text>
            <TextInput placeholder="Nome do hábito" style={styles.input} value={nome} onChangeText={setNome} />
            <TextInput placeholder="Descrição" style={[styles.input, {height: 80}]} multiline value={descricao} onChangeText={setDescricao} />
            <View style={styles.row}>
              <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker({show: true, type: 'inicio'})}>
                <Text style={styles.timeBtnLabel}>Início</Text>
                <Text style={styles.timeBtnValue}>{horaInicio}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker({show: true, type: 'fim'})}>
                <Text style={styles.timeBtnLabel}>Fim</Text>
                <Text style={styles.timeBtnValue}>{horaFim}</Text>
              </TouchableOpacity>
            </View>
            {showPicker.show && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(e, date) => {
                  setShowPicker({show: false, type: 'inicio'});
                  if (date) {
                    const t = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                    showPicker.type === 'inicio' ? setHoraInicio(t) : setHoraFim(t);
                  }
                }}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={salvarHabito}>
                <Text style={styles.btnTextSave}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F4F8' 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#1A1A1A', 
    marginTop: 60, 
    marginLeft: 25, 
    marginBottom: 10 
  },
  clayCard: {
    backgroundColor: '#F0F4F8',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardTime: { fontSize: 14, color: '#0091FF', fontWeight: '600', marginTop: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20 },
  emptySubText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10 },
  fab: {
    position: 'absolute', bottom: 30, right: 30,
    width: 65, height: 65, borderRadius: 32.5,
    backgroundColor: '#0091FF', justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: '#0091FF', shadowOpacity: 0.4, shadowRadius: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalClay: {
    width: '90%', backgroundColor: '#F0F4F8', borderRadius: 40, padding: 30,
    shadowColor: "#000", shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#333', marginBottom: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#E6EDF5', borderRadius: 15, padding: 15, marginBottom: 15,
    fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#D1D9E6'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  timeBtn: { 
    backgroundColor: '#E6EDF5', padding: 15, borderRadius: 15, width: '48%', 
    alignItems: 'center', borderWidth: 1, borderColor: '#D1D9E6' 
  },
  timeBtnLabel: { fontSize: 12, color: '#666' },
  timeBtnValue: { fontSize: 18, fontWeight: 'bold', color: '#0091FF' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { padding: 15, borderRadius: 20, width: '48%', alignItems: 'center' },
  btnCancel: { backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: '#D1D9E6' },
  btnSave: { backgroundColor: '#0091FF' },
  btnTextCancel: { color: '#666', fontWeight: 'bold' },
  btnTextSave: { color: 'white', fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row' },
  iconButton: { marginLeft: 15, padding: 5 }
});
