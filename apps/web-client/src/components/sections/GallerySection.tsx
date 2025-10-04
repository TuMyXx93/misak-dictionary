import { motion } from 'framer-motion';

/**
 * GallerySection - Galería de imágenes
 *
 * Grid de 3 imágenes con efectos hover y overlays
 */

const GALLERY_IMAGES = [
  {
    id: 1,
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvjn9OXj-p5ShNdSHK9QNTqGh-1kvkrVcQzymZtHS0xh9XIiHOXYg0MGuMlFUZn8TUISUqIAxtmOWVTLpU6RWsihvDOt0X6KApBJwffQyz5H9Y97PzyRL8DrfE0gwMVmUF0LKLnMNvGg6ezdb5p9TlZk65v2SfNQ1YZiiVR45WCnmRRY_Doi3bKZGzap2gfNnB5fapCb4FIj858h9NobE6q__HFpuCxT_sUPsdE20yz3VjQdME0rcl72i0rgMJjtH8Pv2yv2Egerg',
    alt: 'Arte Misak 1',
    title: 'La espiral del tiempo',
  },
  {
    id: 2,
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-J9XIRmVqpDJFzCrfFfMg6NNsoNgWWeTj3jj7u3wfQk2A2GyJaFTL3Xz81JnSmfUVCkpwMBX1ZqCPViD28MJFNz8yz9B0KO_LtbwAsXdhEGg5qbYDOd2YSYlT4WIj8xDWxb_ceMoK4Kfi0lyu42r-327KL4YJVVh96_0B_c9aCvmdpauw795lXye-b_mrb2QdOoZdLAbl4ofkoOH1f-boU9ncCA4maMKxP_GD3i6Rihsk87cliy5kBV7Y-SiySkkohY1vAyTNuuI',
    alt: 'Arte Misak 2',
    title: 'Tejiendo el conocimiento',
  },
  {
    id: 3,
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJTM1IiNIJ9qxf948sKXZ_QYjPl4ZNExsRhR7miAvFemK9CD1yXITUa5YwJ5w5MumZh0aO34tu7K0FSs7bNdwjOv6VMg7mh43eANIXLuv3CLu_2u02QUiohIm0G51RW_R0buxjBdSJBuVcl3WYewoo7GgifBe30vZtbYvk0AbfCg2_afDR4TSDtcaSy-joSH0xU_8t6AsaaWKAecsKsGmFS0UnjT6ZGFcuMz5U354mSVzv0FyJaeDj4pCz87c3QEo1ODJO7tP3lUM',
    alt: 'Arte Misak 3',
    title: 'Voces de la tierra',
  },
];

export const GallerySection = () => {
  return (
    <section className="h-screen snap-start flex items-center justify-center bg-background px-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto w-full"
      >
        {GALLERY_IMAGES.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden rounded-lg shadow-lg aspect-square"
          >
            <motion.img
              alt={image.alt}
              className="w-full h-full object-cover transition-transform duration-500"
              src={image.url}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <p className="text-white text-xl font-bold px-4 text-center">{image.title}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
