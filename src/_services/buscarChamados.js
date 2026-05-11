import axios from "axios";

const buscarChamados = async () => {
  const response = await axios.get("api/chamados");
  return response.data;
};

export default buscarChamados; 