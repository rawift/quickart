import generateUniqueId from 'generate-unique-id';


export const generateOrderNumber = () => {
    const prefix = 'QK';
    const no = generateUniqueId({
        length: 8,
        useLetters: false
      });
  return `${prefix}${no}`;
}