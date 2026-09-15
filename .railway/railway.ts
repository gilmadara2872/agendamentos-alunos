import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const evolutionApi = service("evolution-api", {
    source: github("gilmadara2872/agendamentos-alunos", { rootDirectory: "/railway" }),
    replicas: { "sfo": 1 },
  });

  return project("agendamento-atendimento", {
    resources: [evolutionApi],
  });
});
