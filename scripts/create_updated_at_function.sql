-- =====================================================
-- CREAR FUNCIÓN set_updated_at() PARA TRIGGERS
-- =====================================================

-- Crear la función set_updated_at si no existe
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario para documentar la función
COMMENT ON FUNCTION set_updated_at() IS 'Función trigger para actualizar automáticamente el campo updated_at';
