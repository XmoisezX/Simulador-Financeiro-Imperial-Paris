/* Configuração de Permissões por Grupo (RBAC)
   - defaultPermissions: template com todas as permissões (booleans false)
   - createGroupPermissions: gera a configuração de um grupo; 'Administrativo' vem com todas as permissões true e locked
   - listEnabledPermissions: retorna uma lista flat 'Secao.chave' para permissões ativas
   - clonePermissions: utilitário para clonar o template com segurança
*/

export type BoolMap = { [k: string]: boolean };
export type NestedBoolMap = { [k: string]: boolean | NestedBoolMap };

export interface PermissoesSchema {
  Leads: {
    adicionar_lead: boolean;
    remover_leads: boolean;
    editar_leads: boolean;
    ver_leads: boolean;
    ver_lista_de_leads: boolean;
    ver_todos_os_leads: boolean;
    editar_lead: boolean;
  };
  Origens: {
    adicionar_origens: boolean;
    remover_origens: boolean;
    editar_origens: boolean;
    ver_origens: boolean;
    ver_lista_de_origens: boolean;
  };
  Atividades: {
    adicionar_atividades: boolean;
    remover_atividades: boolean;
    editar_atividades: boolean;
    ver_atividade: boolean;
    ver_lista_de_atividades: boolean;
  };
  Chat: {
    criar_chat: boolean;
    atender_chat: boolean;
    ver_lista_de_chat: boolean;
    ver_chat: boolean;
  };
  Relatorios: {
    ver_relatorios: boolean;
    gerar_relatorios: boolean;
  };
  Configuracao_do_sistema: {
    ver_configuracoes: boolean;
    gerenciar_configuracoes: boolean;
  };
  Chaves: {
    adicionar_chaves: boolean;
    remover_chaves: boolean;
    editar_chaves: boolean;
    ver_chaves: boolean;
    ver_lista_de_chaves: boolean;
  };
  Propostas: {
    adicionar_propostas: boolean;
    remover_propostas: boolean;
    editar_propostas: boolean;
    ver_propostas: boolean;
    ver_lista_de_propostas: boolean;
  };
  Usuarios: {
    adicionar_usuarios: boolean;
    remover_usuarios: boolean;
    editar_usuarios: boolean;
    ver_usuarios: boolean;
    ver_lista_de_usuarios: boolean;
  };
  Pessoas: {
    adicionar_pessoas: boolean;
    remover_pessoas: boolean;
    editar_pessoas: boolean;
    ver_lista_de_pessoas: boolean;
    ver_historico_modificacoes: boolean;
    ver_informacoes_internas: boolean;
  };
  Equipes: {
    adicionar_equipes: boolean;
    remover_equipes: boolean;
    editar_equipes: boolean;
    ver_equipes: boolean;
    ver_lista_de_equipes: boolean;
  };
  Condominios: {
    adicionar_condominios: boolean;
    remover_condominios: boolean;
    editar_condominios: boolean;
    ver_condominios: boolean;
    ver_lista_de_condominios: boolean;
    ver_historico_modificacoes: boolean;
    ver_informacoes_internas: boolean;
  };
  Modulo_Locacao: {
    adicionar_contratos: boolean;
    remover_contratos: boolean;
    editar_contratos: boolean;
    ver_contratos: boolean;
    ver_lista_de_contratos: boolean;
    ver_dimob: boolean;
    download_dimob: boolean;
  };
  Oportunidades: {
    adicionar_oportunidades: boolean;
    remover_oportunidades: boolean;
    editar_oportunidades: boolean;
    ver_oportunidades: boolean;
    ver_lista_de_oportunidades: boolean;
    ver_historico_modificacoes: boolean;
  };
  Grupos: {
    adicionar_grupo: boolean;
    remover_grupos: boolean;
    editar_grupos: boolean;
    ver_grupos: boolean;
    ver_lista_de_grupos: boolean;
  };
  Campanhas: {
    adicionar_campanhas: boolean;
    remover_campanhas: boolean;
    editar_campanhas: boolean;
    ver_campanhas: boolean;
    ver_lista_de_campanhas: boolean;
  };
  Assinatura_eletronica: {
    adicionar_envelope: boolean;
  };
  Conta_digital: {
    gerenciar: boolean;
  };
  Imoveis: {
    geral: {
      ver_historico_modificacoes: boolean;
      ver_endereco_dos_imoveis: boolean;
      filtrar_por_proprietario: boolean;
    };
    proprietarios_e_documentos: {
      ver_em_todos_os_imoveis: boolean;
      ver_somente_se_responsavel: boolean;
      nao_ver: boolean;
    };
    observacoes_internas: {
      ver_em_todos_os_imoveis: boolean;
      ver_somente_se_responsavel: boolean;
      nao_ver: boolean;
    };
    venda: {
      adicionar_imoveis: boolean;
      aprovar_imoveis: boolean;
      reajustar_valores_indices: boolean;
      remover_imoveis: boolean;
      ver_imoveis: boolean;
      ver_lista_de_imoveis: boolean;
      editar_todos_os_imoveis: boolean;
      editar_somente_responsavel: boolean;
      nao_edita_imoveis: boolean;
      atualizar_todos_os_imoveis: boolean;
      atualizar_somente_responsavel: boolean;
      nao_atualiza_imoveis: boolean;
      ver_todos_indisponiveis: boolean;
      ver_indisponiveis_se_responsavel: boolean;
      nao_ver_indisponiveis: boolean;
    };
    locacao: {
      adicionar_imoveis: boolean;
      aprovar_imoveis: boolean;
      remover_imoveis: boolean;
      ver_imoveis: boolean;
      ver_lista_de_imoveis: boolean;
      editar_todos_os_imoveis: boolean;
      editar_somente_responsavel: boolean;
      nao_edita_imoveis: boolean;
      atualizar_todos_os_imoveis: boolean;
      atualizar_somente_responsavel: boolean;
      nao_atualiza_imoveis: boolean;
      ver_todos_indisponiveis: boolean;
      ver_indisponiveis_se_responsavel: boolean;
      nao_ver_indisponiveis: boolean;
    };
    temporada: {
      adicionar_imoveis: boolean;
      aprovar_imoveis: boolean;
      remover_imoveis: boolean;
      ver_imoveis: boolean;
      ver_lista_de_imoveis: boolean;
      editar_todos_os_imoveis: boolean;
      editar_somente_responsavel: boolean;
      nao_edita_imoveis: boolean;
      atualizar_todos_os_imoveis: boolean;
      atualizar_somente_responsavel: boolean;
      nao_atualiza_imoveis: boolean;
      ver_todos_indisponiveis: boolean;
      ver_indisponiveis_se_responsavel: boolean;
      nao_ver_indisponiveis: boolean;
    };
  };
}

export interface GroupPermissions {
  grupo: string;
  permissoes: PermissoesSchema;
  locked: boolean; // true => UI deve desabilitar edição (ex.: Administrativo)
}

export const ADMIN_GROUP_NAME = 'Administrativo';

/** Template base: todas as permissões false */
export const defaultPermissions: PermissoesSchema = {
  Leads: {
    adicionar_lead: false,
    remover_leads: false,
    editar_leads: false,
    ver_leads: false,
    ver_lista_de_leads: false,
    ver_todos_os_leads: false,
    editar_lead: false,
  },
  Origens: {
    adicionar_origens: false,
    remover_origens: false,
    editar_origens: false,
    ver_origens: false,
    ver_lista_de_origens: false,
  },
  Atividades: {
    adicionar_atividades: false,
    remover_atividades: false,
    editar_atividades: false,
    ver_atividade: false,
    ver_lista_de_atividades: false,
  },
  Chat: {
    criar_chat: false,
    atender_chat: false,
    ver_lista_de_chat: false,
    ver_chat: false,
  },
  Relatorios: {
    ver_relatorios: false,
    gerar_relatorios: false,
  },
  Configuracao_do_sistema: {
    ver_configuracoes: false,
    gerenciar_configuracoes: false,
  },
  Chaves: {
    adicionar_chaves: false,
    remover_chaves: false,
    editar_chaves: false,
    ver_chaves: false,
    ver_lista_de_chaves: false,
  },
  Propostas: {
    adicionar_propostas: false,
    remover_propostas: false,
    editar_propostas: false,
    ver_propostas: false,
    ver_lista_de_propostas: false,
  },
  Usuarios: {
    adicionar_usuarios: false,
    remover_usuarios: false,
    editar_usuarios: false,
    ver_usuarios: false,
    ver_lista_de_usuarios: false,
  },
  Pessoas: {
    adicionar_pessoas: false,
    remover_pessoas: false,
    editar_pessoas: false,
    ver_lista_de_pessoas: false,
    ver_historico_modificacoes: false,
    ver_informacoes_internas: false,
  },
  Equipes: {
    adicionar_equipes: false,
    remover_equipes: false,
    editar_equipes: false,
    ver_equipes: false,
    ver_lista_de_equipes: false,
  },
  Condominios: {
    adicionar_condominios: false,
    remover_condominios: false,
    editar_condominios: false,
    ver_condominios: false,
    ver_lista_de_condominios: false,
    ver_historico_modificacoes: false,
    ver_informacoes_internas: false,
  },
  Modulo_Locacao: {
    adicionar_contratos: false,
    remover_contratos: false,
    editar_contratos: false,
    ver_contratos: false,
    ver_lista_de_contratos: false,
    ver_dimob: false,
    download_dimob: false,
  },
  Oportunidades: {
    adicionar_oportunidades: false,
    remover_oportunidades: false,
    editar_oportunidades: false,
    ver_oportunidades: false,
    ver_lista_de_oportunidades: false,
    ver_historico_modificacoes: false,
  },
  Grupos: {
    adicionar_grupo: false,
    remover_grupos: false,
    editar_grupos: false,
    ver_grupos: false,
    ver_lista_de_grupos: false,
  },
  Campanhas: {
    adicionar_campanhas: false,
    remover_campanhas: false,
    editar_campanhas: false,
    ver_campanhas: false,
    ver_lista_de_campanhas: false,
  },
  Assinatura_eletronica: {
    adicionar_envelope: false,
  },
  Conta_digital: {
    gerenciar: false,
  },
  Imoveis: {
    geral: {
      ver_historico_modificacoes: false,
      ver_endereco_dos_imoveis: false,
      filtrar_por_proprietario: false,
    },
    proprietarios_e_documentos: {
      ver_em_todos_os_imoveis: false,
      ver_somente_se_responsavel: false,
      nao_ver: false,
    },
    observacoes_internas: {
      ver_em_todos_os_imoveis: false,
      ver_somente_se_responsavel: false,
      nao_ver: false,
    },
    venda: {
      adicionar_imoveis: false,
      aprovar_imoveis: false,
      reajustar_valores_indices: false,
      remover_imoveis: false,
      ver_imoveis: false,
      ver_lista_de_imoveis: false,
      editar_todos_os_imoveis: false,
      editar_somente_responsavel: false,
      nao_edita_imoveis: false,
      atualizar_todos_os_imoveis: false,
      atualizar_somente_responsavel: false,
      nao_atualiza_imoveis: false,
      ver_todos_indisponiveis: false,
      ver_indisponiveis_se_responsavel: false,
      nao_ver_indisponiveis: false,
    },
    locacao: {
      adicionar_imoveis: false,
      aprovar_imoveis: false,
      remover_imoveis: false,
      ver_imoveis: false,
      ver_lista_de_imoveis: false,
      editar_todos_os_imoveis: false,
      editar_somente_responsavel: false,
      nao_edita_imoveis: false,
      atualizar_todos_os_imoveis: false,
      atualizar_somente_responsavel: false,
      nao_atualiza_imoveis: false,
      ver_todos_indisponiveis: false,
      ver_indisponiveis_se_responsavel: false,
      nao_ver_indisponiveis: false,
    },
    temporada: {
      adicionar_imoveis: false,
      aprovar_imoveis: false,
      remover_imoveis: false,
      ver_imoveis: false,
      ver_lista_de_imoveis: false,
      editar_todos_os_imoveis: false,
      editar_somente_responsavel: false,
      nao_edita_imoveis: false,
      atualizar_todos_os_imoveis: false,
      atualizar_somente_responsavel: false,
      nao_atualiza_imoveis: false,
      ver_todos_indisponiveis: false,
      ver_indisponiveis_se_responsavel: false,
      nao_ver_indisponiveis: false,
    },
  },
};

/** Clona profundamente o template para uso seguro */
export function clonePermissions<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Define todos os booleans (em qualquer profundidade) para um valor */
function setAllBooleansDeep(target: any, value: boolean) {
  if (target && typeof target === 'object') {
    Object.keys(target).forEach((k) => {
      const v = (target as any)[k];
      if (typeof v === 'boolean') {
        (target as any)[k] = value;
      } else if (v && typeof v === 'object') {
        setAllBooleansDeep(v, value);
      }
    });
  }
}

/** Cria a configuração de um grupo; 'Administrativo' vem bloqueado e com tudo true */
export function createGroupPermissions(grupo: string): GroupPermissions {
  const perms = clonePermissions(defaultPermissions);
  const isAdmin = grupo.trim().toLowerCase() === ADMIN_GROUP_NAME.toLowerCase();
  if (isAdmin) {
    setAllBooleansDeep(perms, true);
  }
  return {
    grupo,
    permissoes: perms,
    locked: isAdmin,
  };
}

/** Retorna lista 'Secao.chave' para todas permissões ativas (booleans true) */
export function listEnabledPermissions(perms: PermissoesSchema): string[] {
  const result: string[] = [];
  function walk(node: any, path: string[]) {
    Object.keys(node).forEach((key) => {
      const v = node[key];
      const next = [...path, key];
      if (typeof v === 'boolean') {
        if (v) result.push(next.join('.'));
      } else if (v && typeof v === 'object') {
        walk(v, next);
      }
    });
  }
  walk(perms as any, []);
  return result;
}

/** Exemplo de uso (pode ser removido em produção) */
export const EXAMPLE_ADMIN = createGroupPermissions(ADMIN_GROUP_NAME);
export const EXAMPLE_DEFAULT_GROUP = createGroupPermissions('Atendente'); // inicia com tudo false