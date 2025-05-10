import axios from "axios";

class LocationService {
  static async getAddressFromCEP(cep) {
    // Remove caracteres não-numéricos do CEP
    const cleanCEP = cep.replace(/\D/g, "");

    if (cleanCEP.length !== 8) {
      throw new Error("CEP inválido. Deve conter 8 dígitos.");
    }

    try {
      // Usando a API gratuita ViaCEP
      const response = await axios.get(
        `https://viacep.com.br/ws/${cleanCEP}/json/`
      );

      if (response.data.erro) {
        throw new Error("CEP não encontrado.");
      }

      return {
        street: response.data.logradouro,
        neighborhood: response.data.bairro,
        city: response.data.localidade,
        state: response.data.uf,
        fullAddress: `${response.data.logradouro}, ${response.data.bairro}, ${response.data.localidade} - ${response.data.uf}`,
        cep: response.data.cep,
      };
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
      throw new Error(
        "Não foi possível encontrar o endereço para o CEP informado."
      );
    }
  }

  static async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não é suportada por este navegador."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Usando a API gratuita do OpenStreetMap para geocodificação reversa
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );

            const address = response.data.address;

            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              street: address.road || "",
              number: address.house_number || "",
              neighborhood: address.suburb || "",
              city: address.city || address.town || "",
              state: address.state || "",
              country: address.country || "",
              fullAddress: response.data.display_name || "",
            });
          } catch (error) {
            // Caso não consiga obter o endereço, retorna apenas as coordenadas
            console.error(error);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              fullAddress: "",
            });
          }
        },
        (error) => {
          let errorMessage = "Erro desconhecido ao obter localização.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permissão para acessar a localização foi negada.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Informação de localização não está disponível.";
              break;
            case error.TIMEOUT:
              errorMessage =
                "Tempo limite para obter a localização foi excedido.";
              break;
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }
}

export default LocationService;
